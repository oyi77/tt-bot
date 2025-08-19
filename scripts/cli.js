#!/usr/bin/env node

const readline = require('readline');
const tiktokService = require('../src/services/tiktokService');
const logger = require('../src/utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function displayMenu() {
  console.log('\n🤖 Bot Tok CLI - Interactive Menu');
  console.log('=====================================');
  console.log('1. Perform TikTok action');
  console.log('2. Check task status');
  console.log('3. View active tasks');
  console.log('4. View task history');
  console.log('5. View service statistics');
  console.log('6. View available actions');
  console.log('7. View available providers');
  console.log('8. Reset all providers');
  console.log('9. Exit');
  console.log('=====================================');
}

async function performAction() {
  return new Promise((resolve) => {
    rl.question('Enter TikTok video URL: ', async (videoUrl) => {
      if (!videoUrl.trim()) {
        console.log('❌ URL cannot be empty');
        resolve();
        return;
      }

      rl.question('Enter action type (views/likes/shares/favorites): ', async (actionType) => {
        if (!actionType.trim()) {
          console.log('❌ Action type cannot be empty');
          resolve();
          return;
        }

        console.log('\n🚀 Performing action...');
        console.log(`URL: ${videoUrl}`);
        console.log(`Action: ${actionType}`);

        try {
          const result = await tiktokService.performAction(videoUrl, actionType);
          
          if (result.success) {
            console.log('✅ Action completed successfully!');
            console.log(`Task ID: ${result.taskId}`);
            console.log(`Provider: ${result.provider}`);
          } else {
            console.log('❌ Action failed');
            console.log(`Error: ${result.error}`);
            if (result.status === 'retrying') {
              console.log(`Status: ${result.status} (Attempt ${result.attempts}/${result.maxAttempts})`);
            }
          }
        } catch (error) {
          console.log('❌ Error performing action:', error.message);
        }

        resolve();
      });
    });
  });
}

async function checkTaskStatus() {
  return new Promise((resolve) => {
    rl.question('Enter task ID: ', async (taskId) => {
      if (!taskId.trim()) {
        console.log('❌ Task ID cannot be empty');
        resolve();
        return;
      }

      try {
        const task = tiktokService.getTaskStatus(taskId);
        
        if (task) {
          console.log('\n📋 Task Details:');
          console.log(`ID: ${task.id}`);
          console.log(`Status: ${task.status}`);
          console.log(`Action: ${task.actionType}`);
          console.log(`Video URL: ${task.videoUrl}`);
          console.log(`Provider: ${task.provider || 'N/A'}`);
          console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
          
          if (task.completedAt) {
            console.log(`Completed: ${new Date(task.completedAt).toLocaleString()}`);
          }
          
          if (task.error) {
            console.log(`Error: ${task.error}`);
          }
          
          if (task.attempts > 0) {
            console.log(`Attempts: ${task.attempts}/${task.maxAttempts}`);
          }
        } else {
          console.log('❌ Task not found');
        }
      } catch (error) {
        console.log('❌ Error checking task status:', error.message);
      }

      resolve();
    });
  });
}

function viewActiveTasks() {
  const tasks = tiktokService.getActiveTasks();
  
  if (tasks.length === 0) {
    console.log('📋 No active tasks');
    return;
  }

  console.log('\n📋 Active Tasks:');
  console.log('==================');
  
  tasks.forEach((task, index) => {
    console.log(`${index + 1}. Task ID: ${task.id}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Action: ${task.actionType}`);
    console.log(`   Video: ${task.videoUrl.substring(0, 50)}...`);
    console.log(`   Provider: ${task.provider || 'N/A'}`);
    console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
    console.log('   ---');
  });
}

function viewTaskHistory() {
  const history = tiktokService.getTaskHistory(10);
  
  if (history.length === 0) {
    console.log('📋 No task history');
    return;
  }

  console.log('\n📋 Recent Task History (Last 10):');
  console.log('====================================');
  
  history.forEach((task, index) => {
    console.log(`${index + 1}. Task ID: ${task.id}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Action: ${task.actionType}`);
    console.log(`   Video: ${task.videoUrl.substring(0, 50)}...`);
    console.log(`   Provider: ${task.provider || 'N/A'}`);
    console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
    
    if (task.completedAt) {
      console.log(`   Completed: ${new Date(task.completedAt).toLocaleString()}`);
    }
    
    if (task.error) {
      console.log(`   Error: ${task.error}`);
    }
    
    console.log('   ---');
  });
}

function viewServiceStats() {
  const stats = tiktokService.getStats();
  
  console.log('\n📊 Service Statistics:');
  console.log('========================');
  console.log(`Uptime: ${Math.floor(stats.uptime / 1000)} seconds`);
  console.log(`Total Tasks: ${stats.tasks.total}`);
  console.log(`Active Tasks: ${stats.tasks.active}`);
  console.log(`Completed Tasks: ${stats.tasks.completed}`);
  console.log(`Failed Tasks: ${stats.tasks.failed}`);
  console.log(`Cancelled Tasks: ${stats.tasks.cancelled}`);
  
  console.log('\nProvider Statistics:');
  Object.entries(stats.providers).forEach(([name, providerStats]) => {
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  Available: ${providerStats.isAvailable ? 'Yes' : 'No'}`);
    console.log(`  Action Count: ${providerStats.actionCount}`);
    console.log(`  Error Count: ${providerStats.errorCount}`);
    console.log(`  Last Action: ${providerStats.lastActionTime ? new Date(providerStats.lastActionTime).toLocaleString() : 'Never'}`);
  });
}

function viewAvailableActions() {
  const actions = tiktokService.getAvailableActions();
  const providers = tiktokService.getAvailableProviders();
  
  console.log('\n🎯 Available Actions:');
  console.log('======================');
  actions.forEach(action => console.log(`• ${action}`));
  
  console.log('\n🔄 Available Providers:');
  console.log('=========================');
  providers.forEach(provider => console.log(`• ${provider}`));
}

async function resetProviders() {
  try {
    tiktokService.resetProviders();
    console.log('✅ All providers reset successfully');
  } catch (error) {
    console.log('❌ Error resetting providers:', error.message);
  }
}

async function handleMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await performAction();
      break;
    case '2':
      await checkTaskStatus();
      break;
    case '3':
      viewActiveTasks();
      break;
    case '4':
      viewTaskHistory();
      break;
    case '5':
      viewServiceStats();
      break;
    case '6':
      viewAvailableActions();
      break;
    case '7':
      viewAvailableActions();
      break;
    case '8':
      await resetProviders();
      break;
    case '9':
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('❌ Invalid choice. Please select 1-9.');
  }
}

async function main() {
  console.log('🚀 Starting Bot Tok CLI...');
  
  // Main menu loop
  while (true) {
    displayMenu();
    
    const choice = await new Promise((resolve) => {
      rl.question('Select an option (1-9): ', resolve);
    });
    
    await handleMenuChoice(choice);
    
    // Wait for user to press Enter before showing menu again
    await new Promise((resolve) => {
      rl.question('\nPress Enter to continue...', resolve);
    });
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

// Start CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  });
}

module.exports = {
  performAction,
  checkTaskStatus,
  viewActiveTasks,
  viewTaskHistory,
  viewServiceStats,
  viewAvailableActions,
  resetProviders,
};
