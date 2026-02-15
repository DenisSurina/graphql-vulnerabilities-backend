import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';

export async function createApp() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  return { server };
}
