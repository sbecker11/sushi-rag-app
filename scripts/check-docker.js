#!/usr/bin/env node

import { execSync } from 'child_process';
import { exit } from 'process';
import dotenv from 'dotenv';

// Load environment variables from .env file (if it exists)
dotenv.config();

const REQUIRED_SERVICES = [
  process.env.POSTGRES_CONTAINER || 'sushi-rag-app-postgres',
  'sushi-rag-app-chromadb'
];
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkDockerRunning() {
  log('\n🔍 Checking if Docker Desktop is running...', YELLOW);
  
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 5000 });
    log('✅ Docker Desktop is running', GREEN);
    return true;
  } catch (error) {
    log('❌ Docker Desktop is NOT running!', RED);
    log('\nPlease start Docker Desktop and try again.', RED);
    log('You can start it by:', YELLOW);
    log('  - Opening Docker Desktop from Applications', YELLOW);
    log('  - Or running: open -a Docker', YELLOW);
    return false;
  }
}

function getRunningContainers() {
  try {
    const output = execSync('docker ps --format "{{.Names}}"', { 
      encoding: 'utf-8',
      timeout: 5000
    });
    return output.trim().split('\n').filter(name => name);
  } catch (error) {
    return [];
  }
}

function getContainerHealth(containerName) {
  try {
    const output = execSync(
      `docker inspect --format='{{.State.Health.Status}}' ${containerName}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000 }
    );
    return output.trim();
  } catch (error) {
    // Container might not have health check
    try {
      const status = execSync(
        `docker inspect --format='{{.State.Status}}' ${containerName}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000 }
      );
      return status.trim() === 'running' ? 'running' : 'unhealthy';
    } catch {
      return 'unknown';
    }
  }
}

function checkServices() {
  log('\n🔍 Checking required services...', YELLOW);
  
  const runningContainers = getRunningContainers();
  const missingServices = [];
  const unhealthyServices = [];

  for (const service of REQUIRED_SERVICES) {
    if (!runningContainers.includes(service)) {
      log(`❌ Service "${service}" is NOT running`, RED);
      missingServices.push(service);
    } else {
      const health = getContainerHealth(service);
      
      if (health === 'healthy' || health === 'running') {
        log(`✅ Service "${service}" is running and healthy`, GREEN);
      } else if (health === 'starting') {
        log(`⚠️  Service "${service}" is starting... (health: ${health})`, YELLOW);
        unhealthyServices.push(service);
      } else {
        log(`❌ Service "${service}" is unhealthy (status: ${health})`, RED);
        unhealthyServices.push(service);
      }
    }
  }

  if (missingServices.length > 0) {
    log('\n❌ Some required services are not running!', RED);
    log('\nTo start the services, run:', YELLOW);
    log('  npm run docker:up', YELLOW);
    log('\nOr:', YELLOW);
    log('  docker-compose up -d', YELLOW);
    return false;
  }

  if (unhealthyServices.length > 0) {
    log('\n⚠️  Some services are not ready yet. Waiting a few more seconds...', YELLOW);
    log('If this persists, check the logs with:', YELLOW);
    log('  docker-compose logs', YELLOW);
    return false;
  }

  log('\n✅ All required services are running!', GREEN);
  return true;
}

async function main() {
  log('========================================', YELLOW);
  log('     Docker & Services Check', YELLOW);
  log('========================================', YELLOW);

  // Check if Docker is running
  if (!checkDockerRunning()) {
    exit(1);
  }

  // Check if required services are running (retry briefly until healthy)
  const attempts = parseInt(process.env.DOCKER_HEALTHCHECK_ATTEMPTS || '6', 10);
  const waitMs = parseInt(process.env.DOCKER_HEALTHCHECK_WAIT_MS || '3000', 10);

  for (let i = 1; i <= attempts; i++) {
    const ok = checkServices();
    if (ok) {
      log('\n✅ All checks passed! Starting application...', GREEN);
      log('========================================\n', YELLOW);
      return;
    }

    if (i < attempts) {
      log(`\n⏳ Waiting for services to be ready... (attempt ${i}/${attempts})`, YELLOW);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  exit(1);
}

main();

