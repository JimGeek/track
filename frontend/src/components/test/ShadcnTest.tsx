import React from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const ShadcnTest: React.FC = () => {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">shadcn/ui Test Components</h1>
      
      <div className="space-x-2">
        <Button variant="default">Default Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="destructive">Destructive Button</Button>
      </div>

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test card to verify shadcn/ui is working correctly.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShadcnTest;