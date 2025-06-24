import 'dotenv/config';
import app from './app';

console.log('Booting server...');
console.log('Start of server.ts');

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

const port = process.env.PORT || 4000;

// await connectMongo();

async function startServer() {
  try {
    // DB implementation (MongoDB, Pinecone,...)
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    app
      .listen(port, () => {
        console.log(`✅ App listening on port ${port}`);
      })
      .on('error', (err) => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
      });
  } catch (error) {
    console.error(
      '❌ Failed during initialization:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Execute the startup function
startServer().catch((error) => {
  console.error('❌ Unhandled error during startup:', error);
  process.exit(1);
});
