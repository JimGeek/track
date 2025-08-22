#!/bin/bash

# Test Critical Bugs Script
# This script runs the comprehensive test suite for the critical bugs
# identified in the Track frontend application

set -e

echo "🔍 Track Frontend - Critical Bug Testing Suite"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${BLUE}🧪 Running Critical Bug Tests${NC}"
echo ""

# Function to run a specific test suite
run_test_suite() {
    local test_name=$1
    local test_pattern=$2
    local description=$3
    
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    echo "Description: $description"
    echo "Pattern: $test_pattern"
    echo ""
    
    if npm test -- --testPathPattern="$test_pattern" --passWithNoTests --coverage=false --watchAll=false; then
        echo -e "${GREEN}✅ $test_name tests passed${NC}"
    else
        echo -e "${RED}❌ $test_name tests failed${NC}"
        return 1
    fi
    echo ""
}

# Track test results
failed_tests=0
total_tests=0

echo "Running individual test suites..."
echo "================================="

# Test 1: Date Saving Functionality Bug
total_tests=$((total_tests + 1))
if ! run_test_suite \
    "Date Saving Functionality" \
    "FeatureForm.test.tsx" \
    "Tests the critical bug where date fields are lost during form submission"; then
    failed_tests=$((failed_tests + 1))
fi

# Test 2: Gantt Chart Date Display Bug
total_tests=$((total_tests + 1))
if ! run_test_suite \
    "Gantt Chart Date Display" \
    "FeatureGanttView.test.tsx" \
    "Tests the critical bug where features show random dates when no actual dates are set"; then
    failed_tests=$((failed_tests + 1))
fi

# Test 3: Dependency Validation Bug
total_tests=$((total_tests + 1))
if ! run_test_suite \
    "Dependency Validation Logic" \
    "dependencyValidation.test.ts" \
    "Tests the critical bug where dependency filtering allows circular dependencies"; then
    failed_tests=$((failed_tests + 1))
fi

# Test 4: API Date Handling Integration
total_tests=$((total_tests + 1))
if ! run_test_suite \
    "API Date Handling Integration" \
    "apiDateHandling.test.ts" \
    "Tests date persistence and retrieval through API calls"; then
    failed_tests=$((failed_tests + 1))
fi

# Test 5: Feature Workflows Integration
total_tests=$((total_tests + 1))
if ! run_test_suite \
    "Feature Workflows Integration" \
    "featureWorkflows.test.tsx" \
    "Tests end-to-end workflows for feature creation and editing"; then
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo "Running Full Test Suite with Coverage..."
echo "========================================"

# Run all tests with coverage
echo -e "${BLUE}🔍 Running complete test suite with coverage analysis...${NC}"
echo ""

if npm test -- --coverage --watchAll=false --passWithNoTests; then
    echo -e "${GREEN}✅ Full test suite completed successfully${NC}"
else
    echo -e "${RED}❌ Some tests in the full suite failed${NC}"
    failed_tests=$((failed_tests + 1))
    total_tests=$((total_tests + 1))
fi

echo ""
echo "Test Summary"
echo "============"

passed_tests=$((total_tests - failed_tests))

echo -e "Total Test Suites: ${BLUE}$total_tests${NC}"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All critical bug tests passed!${NC}"
    echo ""
    echo "What this means:"
    echo "- ✅ Date saving functionality is working correctly"
    echo "- ✅ Gantt chart date display is properly handled"
    echo "- ✅ Dependency validation prevents circular dependencies"
    echo "- ✅ API date handling maintains data integrity"
    echo "- ✅ Feature workflows complete successfully"
    echo ""
    echo "Coverage report generated in: ./coverage/"
    echo "Open coverage/lcov-report/index.html in your browser for detailed coverage analysis"
    
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some critical bug tests failed!${NC}"
    echo ""
    echo "Please review the test failures above and address the issues."
    echo "The failing tests indicate that the critical bugs are still present"
    echo "or that the fixes need further refinement."
    echo ""
    echo "Next steps:"
    echo "1. Review the failing test output above"
    echo "2. Check the implementation in the corresponding source files"
    echo "3. Fix the issues identified by the tests"
    echo "4. Re-run this script to verify fixes"
    echo ""
    echo "For detailed debugging:"
    echo "  npm test -- --testPathPattern='failing-test-pattern' --verbose"
    
    exit 1
fi