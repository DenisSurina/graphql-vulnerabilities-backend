import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';
import { verifyToken } from './auth.js';

export async function createApp() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // VULN: Introspection enabled — attackers can discover entire schema
    introspection: true,
    // VULN: Allows batched HTTP requests — enables batching attacks
    allowBatchedHttpRequests: true,
    // VULN: Detailed error messages with stack traces exposed to clients
    formatError: (formattedError, error) => {
      return {
        message: formattedError.message,
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: {
          ...formattedError.extensions,
          // VULN: Exposing internal stack traces to clients
          stacktrace: error.extensions?.stacktrace,
        },
      };
    },
  });

  // Context factory — extracts user from JWT in Authorization header
  const context = async ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = token ? verifyToken(token) : null;
    return { user };
  };

  return { server, context };
}
