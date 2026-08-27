import React from 'react';
import { Redirect } from 'expo-router';

export default function EmployeeLearningRedirect() {
  return <Redirect href="/(employee)/dashboard" />;
}
