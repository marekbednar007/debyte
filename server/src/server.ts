import 'dotenv/config';
import app from './app';
import DatabaseConnection from './config/database';

console.log('Booting server...');
console.log('Start of server.ts');

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

const port = process.env.PORT || 4000;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await DatabaseConnection.connect();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
};

async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

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
