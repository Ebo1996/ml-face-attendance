import { useState } from 'react'
import { User, Calendar, FileText, Settings, LogOut } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Avatar,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Skeleton,
  SkeletonCard,
  toast,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
  Dropdown,
} from './index'

/**
 * Component Showcase - Demo page for testing all UI components
 * This file is for development only and will not be included in production routes
 */
export function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Component Showcase"
          description="A comprehensive demo of all available UI components"
        />
        
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><User size={20} /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Inputs & Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs & Forms</CardTitle>
            <CardDescription>Form controls and validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Email" type="email" placeholder="Enter your email" />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              error="Password must be at least 8 characters"
            />
            <Input
              label="Name"
              placeholder="Your name"
              helperText="This will be displayed on your profile"
            />
            <Select
              label="Department"
              options={[
                { value: '', label: 'Select department' },
                { value: 'engineering', label: 'Engineering' },
                { value: 'hr', label: 'Human Resources' },
                { value: 'sales', label: 'Sales' },
              ]}
            />
          </CardContent>
        </Card>
        
        {/* Badges & Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>Badges & Avatars</CardTitle>
            <CardDescription>Status indicators and user representations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar size="sm" />
              <Avatar />
              <Avatar size="lg" fallback="JD" />
              <Avatar size="xl" src="https://i.pravatar.cc/150?img=1" alt="User" />
            </div>
          </CardContent>
        </Card>
        
        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value="248"
            icon={User}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Present Today"
            value="230"
            subtitle="92.7% attendance"
            icon={Calendar}
            variant="present"
          />
          <StatCard
            title="Late Today"
            value="12"
            subtitle="4.8%"
            icon={Calendar}
            variant="late"
          />
          <StatCard
            title="Absent Today"
            value="6"
            subtitle="2.4%"
            icon={Calendar}
            variant="absent"
          />
        </div>
        
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Data table with pagination</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell>john@example.com</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jane Smith</TableCell>
                  <TableCell>jane@example.com</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Spinners and skeletons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-center">
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <SkeletonCard />
          </CardContent>
        </Card>
        
        {/* Empty & Error States */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={FileText}
                title="No data found"
                description="There are no records to display at this time."
                action={{
                  label: 'Create New',
                  onClick: () => toast.info('Create new clicked'),
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ErrorState
                title="Failed to load"
                message="Unable to fetch data. Please check your connection."
                onRetry={() => toast.info('Retrying...')}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Modal & Dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>Modal & Dropdown</CardTitle>
            <CardDescription>Interactive overlays</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Button onClick={() => toast.success('Success! Operation completed.')}>
                Show Success Toast
              </Button>
              <Button onClick={() => toast.error('Error! Something went wrong.')}>
                Show Error Toast
              </Button>
              <Dropdown
                trigger={<Button variant="outline">Options</Button>}
                items={[
                  {
                    label: 'Profile',
                    icon: <User size={16} />,
                    onClick: () => toast.info('Profile clicked'),
                  },
                  {
                    label: 'Settings',
                    icon: <Settings size={16} />,
                    onClick: () => toast.info('Settings clicked'),
                  },
                  'divider',
                  {
                    label: 'Logout',
                    icon: <LogOut size={16} />,
                    onClick: () => toast.info('Logout clicked'),
                    danger: true,
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Changes saved!')
                setIsModalOpen(false)
              }}>
                Save Changes
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            This is an example modal dialog. You can include any content here, such as forms,
            confirmation messages, or detailed information.
          </p>
        </Modal>
      </div>
    </div>
  )
}
