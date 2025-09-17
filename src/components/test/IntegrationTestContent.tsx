'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ethers } from 'ethers';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

type TestResult = {
  success: boolean;
  message?: string;
};

export function IntegrationTestContent() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Basic connectivity test
  const runBasicTest = async (testName: string) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      // Simple test - just check if ethers is available
      const version = ethers.version;
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, message: `Ethers version: ${version}` }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integration Tests</h1>
        <p className="text-gray-600 mt-2">
          Basic integration tests for core functionality
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Basic Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Connectivity Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => runBasicTest('basic')}
                disabled={loading.basic}
                variant="outline"
              >
                {loading.basic ? 'Testing...' : 'Run Basic Test'}
              </Button>
              
              {testResults.basic && (
                <div className={`p-4 rounded-lg ${
                  testResults.basic.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`font-medium ${
                    testResults.basic.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResults.basic.success ? '✅ Test Passed' : '❌ Test Failed'}
                  </div>
                  {testResults.basic.message && (
                    <div className={`text-sm mt-1 ${
                      testResults.basic.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults.basic.message}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}