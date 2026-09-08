/**
 * Employee Management Page - Debug Version
 */

import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employees';

export const EmployeeManagementPageDebug: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading employees...');
      setLoading(true);
      const data = await employeeService.getEmployees();
      console.log('Employees loaded:', data);
      setEmployees(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(err?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Employee Management (Debug)</h1>
      <p>Total employees: {employees.length}</p>
      
      <table border={1} cellPadding={10} style={{ width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Department</th>
            <th>Position</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.email}</td>
              <td>{emp.full_name}</td>
              <td>{emp.role}</td>
              <td>{emp.department}</td>
              <td>{emp.position}</td>
              <td>{emp.is_active ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {employees.length === 0 && (
        <p style={{ marginTop: '20px', color: 'gray' }}>No employees found</p>
      )}
    </div>
  );
};
