import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken } from '../auth.js';

export const resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      if (!context.user) return null;
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [context.user.id]);
      return rows[0] || null;
    },

    // VULN: IDOR — any user (or unauthenticated) can fetch any user by ID
    user: async (_parent, { id }) => {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    },

    // VULN: SQL Injection — search parameter concatenated directly into SQL
    users: async (_parent, { search }) => {
      let query = 'SELECT * FROM users';
      if (search) {
        query += ` WHERE username LIKE '%${search}%' OR email LIKE '%${search}%'`;
      }
      const [rows] = await pool.query(query);
      return rows;
    },

    book: async (_parent, { id }) => {
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
      return rows[0] || null;
    },

    // VULN: SQL Injection — search parameter concatenated directly into SQL
    books: async (_parent, { search }) => {
      let query = 'SELECT * FROM books';
      if (search) {
        query += ` WHERE name LIKE '%${search}%' OR author LIKE '%${search}%' OR genre LIKE '%${search}%'`;
      }
      const [rows] = await pool.query(query);
      return rows;
    },

    // VULN: No auth — if no user in context, returns empty instead of error
    myBooks: async (_parent, _args, context) => {
      if (!context.user) return [];
      const [rows] = await pool.execute(
        `SELECT b.* FROM books b
         JOIN user_books ub ON b.id = ub.book_id
         WHERE ub.user_id = ?`,
        [context.user.id]
      );
      return rows;
    },
  },

  Mutation: {
    // VULN: No input validation — accepts any length username/email/password
    register: async (_parent, { username, email, password }) => {
      const hashed = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashed]
      );
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      const user = rows[0];
      const token = signToken({ id: user.id, username: user.username, role: user.role });
      return { token, user };
    },

    // VULN: No rate limiting, batchable, no account lockout
    login: async (_parent, { username, password }) => {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      const user = rows[0];
      if (!user) {
        // VULN: Verbose error reveals user does not exist
        throw new Error(`User '${username}' not found`);
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        // VULN: Different error for wrong password vs wrong username
        throw new Error('Invalid password');
      }
      const token = signToken({ id: user.id, username: user.username, role: user.role });
      return { token, user };
    },

    // VULN: No auth/role check — anyone can add books (should be admin only)
    addBook: async (_parent, { name, author, genre, price, description, imageUrl }) => {
      const [result] = await pool.execute(
        'INSERT INTO books (name, author, genre, price, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, author, genre, price, description || null, imageUrl || null]
      );
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [result.insertId]);
      return rows[0];
    },

    // VULN: No auth/role check — anyone can delete books (should be admin only)
    deleteBook: async (_parent, { id }) => {
      const [result] = await pool.execute('DELETE FROM books WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    // VULN: No auth check — uses context.user if available but doesn't enforce login
    buyBook: async (_parent, { bookId }, context) => {
      const userId = context.user?.id || 0;
      // Check if already purchased
      const [existing] = await pool.execute(
        'SELECT * FROM user_books WHERE user_id = ? AND book_id = ?',
        [userId, bookId]
      );
      if (existing.length > 0) {
        throw new Error('You already own this book');
      }
      await pool.execute(
        'INSERT INTO user_books (user_id, book_id) VALUES (?, ?)',
        [userId, bookId]
      );
      const [rows] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
      return rows[0];
    },

    // VULN: No auth — anyone can delete any user
    deleteUser: async (_parent, { id }) => {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
  },

  // Field resolvers enabling circular/deep resolution
  User: {
    createdAt: (user) => user.created_at?.toISOString?.() || user.created_at,
    // VULN: N+1 query — no DataLoader
    purchasedBooks: async (user) => {
      const [rows] = await pool.execute(
        `SELECT b.* FROM books b
         JOIN user_books ub ON b.id = ub.book_id
         WHERE ub.user_id = ?`,
        [user.id]
      );
      return rows;
    },
    // VULN: Self-referencing — returns all OTHER users as "friends"
    // Enables infinite depth: { users { friends { friends { friends { ... } } } } }
    friends: async (user) => {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id != ?', [user.id]);
      return rows;
    },
  },

  Book: {
    createdAt: (book) => book.created_at?.toISOString?.() || book.created_at,
    imageUrl: (book) => book.image_url,
    // VULN: Circular reference — Book -> buyers (Users) -> purchasedBooks -> buyers -> ...
    // VULN: Exposes who bought what — no privacy
    buyers: async (book) => {
      const [rows] = await pool.execute(
        `SELECT u.* FROM users u
         JOIN user_books ub ON u.id = ub.user_id
         WHERE ub.book_id = ?`,
        [book.id]
      );
      return rows;
    },
  },
};
