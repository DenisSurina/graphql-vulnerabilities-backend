export const typeDefs = `#graphql
  # VULN: Password hash exposed as a queryable field
  # VULN: Circular references (User -> books -> buyers -> books -> ...) enable depth attacks
  # VULN: Introspection is enabled — full schema discoverable by attackers

  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
    role: String!
    createdAt: String
    purchasedBooks: [Book]
    friends: [User]
  }

  type Book {
    id: ID!
    name: String!
    author: String!
    genre: String!
    price: Float!
    description: String
    imageUrl: String
    createdAt: String
    buyers: [User]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # VULN: No auth required for any query
    me: User
    user(id: ID!): User
    users(search: String): [User]
    book(id: ID!): Book
    books(search: String): [Book]
    myBooks: [Book]
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload
    # VULN: No rate limiting — batchable and alias-attackable
    login(username: String!, password: String!): AuthPayload
    # VULN: No auth check — anyone can add books (should be admin only)
    addBook(name: String!, author: String!, genre: String!, price: Float!, description: String, imageUrl: String): Book
    # VULN: No auth check — anyone can delete books (should be admin only)
    deleteBook(id: ID!): Boolean
    # VULN: No auth check — anyone can "buy" a book for any user
    buyBook(bookId: ID!): Book
    # VULN: No auth — anyone can delete any user
    deleteUser(id: ID!): Boolean
  }
`;
