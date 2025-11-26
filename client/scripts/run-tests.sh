#!/bin/bash

echo "Running Frontend Tests..."
echo "========================="

# Unit Tests
echo "1. Running Unit Tests..."
npm run test:unit -- --reporter=verbose

# Integration Tests
echo "2. Running Integration Tests..."
npm run test:integration -- --reporter=verbose

# Acceptance Tests
echo "3. Running Acceptance Tests..."
npm run test:acceptance -- --reporter=verbose

# Coverage Report
echo "4. Generating Coverage Report..."
npm run test:coverage

echo "Frontend Tests Complete!"
echo "Coverage report available at: coverage/index.html"