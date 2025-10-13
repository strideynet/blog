import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SimpleCalculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Interactive Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md text-right text-2xl font-mono">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={clear} variant="secondary" className="col-span-2">
            Clear
          </Button>
          <Button onClick={() => inputOperation('/')} variant="secondary">
            ÷
          </Button>
          <Button onClick={() => inputOperation('*')} variant="secondary">
            ×
          </Button>

          <Button onClick={() => inputNumber('7')} variant="outline">
            7
          </Button>
          <Button onClick={() => inputNumber('8')} variant="outline">
            8
          </Button>
          <Button onClick={() => inputNumber('9')} variant="outline">
            9
          </Button>
          <Button onClick={() => inputOperation('-')} variant="secondary">
            −
          </Button>

          <Button onClick={() => inputNumber('4')} variant="outline">
            4
          </Button>
          <Button onClick={() => inputNumber('5')} variant="outline">
            5
          </Button>
          <Button onClick={() => inputNumber('6')} variant="outline">
            6
          </Button>
          <Button onClick={() => inputOperation('+')} variant="secondary">
            +
          </Button>

          <Button onClick={() => inputNumber('1')} variant="outline">
            1
          </Button>
          <Button onClick={() => inputNumber('2')} variant="outline">
            2
          </Button>
          <Button onClick={() => inputNumber('3')} variant="outline">
            3
          </Button>
          <Button onClick={performCalculation} variant="default" className="row-span-2">
            =
          </Button>

          <Button onClick={() => inputNumber('0')} variant="outline" className="col-span-2">
            0
          </Button>
          <Button onClick={() => inputNumber('.')} variant="outline">
            .
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}