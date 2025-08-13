import React, { useState, useEffect } from 'react';
import { Camera, Upload, MapPin, Star, DollarSign, Clock, Check, X, Eye, MessageSquare, Calendar, FileText, Shield, Zap, Home, User, Settings, Menu, ChevronRight, Phone, Mail, ExternalLink } from 'lucide-react';

// Types and Interfaces
interface User {
  id: string;
  role: 'client' | 'landlord' | 'property_manager' | 'contractor' | 'admin';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface Job {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'paint' | 'handyman' | 'roof' | 'hvac' | 'flooring';
  status: 'draft' | 'quoting' | 'awaiting_accept' | 'accepted' | 'scheduled' | 'in_progress' | 'disputed' | 'completed' | 'cancelled';
  photos: string[];
  aiTags: string[];
  aiScopeMd: string;
  aiClientPriceCents: number;
  contractorNetCents: number;
  marginPct: number;
  rushFlag: boolean;
  afterHoursFlag: boolean;
  scheduledAt?: string;
  city: string;
  zip: string;
  renterFlag: boolean;
  createdAt: string;
}

interface Contractor {
  id: string;
  company: string;
  licenseNumber: string;
  verified: boolean;
  rating: number;
  completedJobs: number;
  avatarUrl?: string;
}

interface JobOffer {
  id: string;
  jobId: string;
  contractorId: string;
  offerType: 'broadcast' | 'accept' | 'counter' | 'decline' | 'expired';
  counterNetCents?: number;
  expiresAt: string;
  acceptedAt?: string;
  contractor: Contractor;
}

// Mock Data
const mockUser: User = {
  id: '1',
  role: 'client',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah@example.com',
  phone: '+1 (555) 123-4567'
};

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Kitchen Faucet Replacement',
    description: 'Replace leaking kitchen faucet',
    category: 'plumbing',
    status: 'completed',
    photos: ['/api/placeholder/400/300'],
    aiTags: ['faucet_leak', 'under_sink_damage'],
    aiScopeMd: '• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
    aiClientPriceCents: 24000,
    contractorNetCents: 19200,
    marginPct: 0.20,
    rushFlag: false,
    afterHoursFlag: false,
    city: 'Austin',
    zip: '78701',
    renterFlag: false,
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Bathroom Tile Repair',
    description: 'Fix cracked tiles around bathtub',
    category: 'handyman',
    status: 'in_progress',
    photos: ['/api/placeholder/400/300'],
    aiTags: ['tile_crack', 'grout_damage'],
    aiScopeMd: '• Remove damaged tiles\n• Apply new adhesive\n• Install replacement tiles\n• Regrout area',
    aiClientPriceCents: 36000,
    contractorNetCents: 28800,
    marginPct: 0.20,
    rushFlag: false,
    afterHoursFlag: false,
    city: 'Austin',
    zip: '78701',
    renterFlag: true,
    createdAt: '2025-01-20T14:30:00Z'
  }
];

const mockContractors: Contractor[] = [
  {
    id: '1',
    company: 'Austin Plumbing Pro',
    licenseNumber: 'TX-PL-12345',
    verified: true,
    rating: 4.8,
    completedJobs: 127,
    avatarUrl: '/api/placeholder/150/150'
  },
  {
    id: '2',
    company: 'Hill Country Handyman',
    licenseNumber: 'TX-HM-67890',
    verified: true,
    rating: 4.9,
    completedJobs: 89,
    avatarUrl: '/api/placeholder/150/150'
  }
];

// Components
const Header: React.FC<{ user?: User; onMenuToggle: () => void }> = ({ user, onMenuToggle }) => (
  <header className="bg-white shadow-sm border-b sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <button onClick={onMenuToggle} className="md:hidden p-2">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-shrink-0 ml-2 md:ml-0">
            <h1 className="text-2xl font-bold text-blue-600">PreReno</h1>
          </div>
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-gray-700">
              {user.firstName} {user.lastName}
            </span>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        ) : (
          <div className="flex space-x-4">
            <button className="text-gray-600 hover:text-gray-900">Sign In</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  </header>
);

const Sidebar: React.FC<{ isOpen: boolean; currentView: string; onViewChange: (view: string) => void; onClose: () => void }> = ({ 
  isOpen, currentView, onViewChange, onClose 
}) => (
  <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b md:hidden">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'new-job', label: 'New Job', icon: Camera },
          { id: 'jobs', label: 'My Jobs', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onViewChange(id); onClose(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              currentView === id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  </div>
);

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* Hero Section */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI-Powered Home Repairs
          <span className="text-blue-600"> in 60 Seconds</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Scan, get instant AI quotes, book insured local pros, and pay securely. 
          Perfect for homeowners and renters.
        </p>
        <button 
          onClick={onGetStarted}
          className="bg-blue-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto space-x-2"
        >
          <Camera className="h-5 w-5" />
          <span>Scan & Quote Now</span>
        </button>
      </div>
    </div>

    {/* How It Works */}
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Camera,
              title: '1. Scan or Upload',
              description: 'Take photos of your repair needs or upload existing images'
            },
            {
              icon: Zap,
              title: '2. Get AI Quote',
              description: 'Receive an instant, accurate price estimate in under 60 seconds'
            },
            {
              icon: Check,
              title: '3. Book & Pay',
              description: 'Local insured pros accept your job. Pay securely when complete.'
            }
          ].map(({ icon: Icon, title, description }, index) => (
            <div key={index} className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Trust Badges */}
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Shield, label: 'Insured Pros', desc: 'All contractors verified & insured' },
            { icon: Star, label: '4.9/5 Rating', desc: 'Average customer satisfaction' },
            { icon: Clock, label: '60 Second Quotes', desc: 'Instant AI-powered estimates' },
            { icon: DollarSign, label: 'Fair Pricing', desc: 'Transparent, competitive rates' }
          ].map(({ icon: Icon, label, desc }, index) => (
            <div key={index} className="text-center">
              <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">{label}</h4>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Renter-Friendly Callout */}
    <div className="bg-blue-600 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Works for Renters Too!</h2>
        <p className="text-lg">
          Easy landlord approval process with automatic COI handling and building compliance
        </p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ user: User; jobs: Job[] }> = ({ user, jobs }) => {
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const activeJobs = jobs.filter(job => !['completed', 'cancelled'].includes(job.status));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your repairs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{activeJobs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedJobs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">$847</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Camera className="h-8 w-8 text-blue-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium">Start New Job</h3>
              <p className="text-sm text-gray-600">Scan or upload photos for instant quote</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-8 w-8 text-green-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium">Schedule Service</h3>
              <p className="text-sm text-gray-600">Book recurring maintenance</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-600 mb-4">Start by scanning your first repair</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Create First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'awaiting_accept': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  return (
    <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <img 
        src={job.photos[0] || '/api/placeholder/80/80'} 
        alt={job.title}
        className="w-16 h-16 rounded-lg object-cover"
      />
      <div className="ml-4 flex-1">
        <h3 className="font-medium text-gray-900">{job.title}</h3>
        <p className="text-sm text-gray-600">{job.city}, {job.zip}</p>
        <div className="flex items-center mt-1 space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
          {job.renterFlag && (
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              Renter
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatPrice(job.aiClientPriceCents)}</p>
        <p className="text-sm text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

const NewJobForm: React.FC<{ onJobCreated: (job: Job) => void }> = ({ onJobCreated }) => {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'handyman' as const,
    address: '',
    isRenter: false,
    isRush: false,
    isAfterHours: false
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePhotos = async () => {
    if (photos.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResults = {
        tags: ['faucet_leak', 'water_damage', 'cabinet_moisture'],
        scope: '• Remove old kitchen faucet\n• Install new single-handle faucet with pull-down sprayer\n• Replace damaged cabinet base\n• Test all connections for leaks\n• Clean and sanitize work area',
        estimatedHours: 2.5,
        materialCost: 15000, // $150 in cents
        laborCost: 12000, // $120 in cents
        totalCost: 27000, // $270 in cents
        clientPrice: 32400, // $324 with 20% margin
        contractorNet: 27000,
        confidence: 0.85
      };
      
      setAiResults(mockResults);
      setIsAnalyzing(false);
      setStep(3);
    }, 3000);
  };

  const createJob = () => {
    if (!aiResults) return;

    const newJob: Job = {
      id: Date.now().toString(),
      title: formData.title || 'Kitchen Faucet Repair',
      description: formData.description || 'AI-detected kitchen faucet replacement',
      category: formData.category,
      status: 'draft',
      photos: photos.map((_, index) => `/api/placeholder/400/300?${index}`),
      aiTags: aiResults.tags,
      aiScopeMd: aiResults.scope,
      aiClientPriceCents: aiResults.clientPrice,
      contractorNetCents: aiResults.contractorNet,
      marginPct: 0.20,
      rushFlag: formData.isRush,
      afterHoursFlag: formData.isAfterHours,
      city: 'Austin',
      zip: '78701',
      renterFlag: formData.isRenter,
      createdAt: new Date().toISOString()
    };

    onJobCreated(newJob);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">New Repair Job</h1>
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>
            <p className="text-gray-600 mb-4">
              Take clear photos of the repair area. Our AI will analyze them to provide an accurate quote.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Camera className="h-12 w-12 text-gray-400" />
                <span className="text-lg font-medium text-gray-900">
                  Take or Upload Photos
                </span>
                <span className="text-sm text-gray-600">
                  PNG, JPG up to 10MB each (max 5 photos)
                </span>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div />
            <button
              onClick={() => setStep(2)}
              disabled={photos.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next: Add Details
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Kitchen Faucet Replacement"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="handyman">Handyman</option>
                  <option value="paint">Painting</option>
                  <option value="roof">Roofing</option>
                  <option value="hvac">HVAC</option>
                  <option value="flooring">Flooring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Austin, TX 78701"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRenter: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">I'm a renter (requires landlord approval)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRush}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRush: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Rush job (+50% fee)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAfterHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAfterHours: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">After hours/weekend (+25% fee)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              onClick={analyzePhotos}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Get AI Quote
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">AI Analysis Complete</h2>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing photos with AI...</p>
                <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
              </div>
            ) : aiResults && (
              <div className="space-y-6">
                {/* Price Display */}
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-blue-600 mb-2">
                    ${(aiResults.clientPrice / 100).toFixed(0)}
                  </h3>
                  <p className="text-gray-600">Total price (includes all fees)</p>
                  <div className="mt-3 text-sm text-gray-500">
                    <p>Contractor receives: ${(aiResults.contractorNet / 100).toFixed(0)}</p>
                    <p>Platform fee: ${((aiResults.clientPrice - aiResults.contractorNet) / 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* AI Detected Issues */}
                <div>
                  <h4 className="font-medium mb-2">Detected Issues:</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiResults.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                      >
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scope of Work */}
                <div>
                  <h4 className="font-medium mb-2">Scope of Work:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {aiResults.scope}
                    </pre>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">AI Confidence:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${aiResults.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {(aiResults.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {aiResults && (
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={createJob}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Book at This Price</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const JobsList: React.FC<{ jobs: Job[] }> = ({ jobs }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const statusOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'draft', label: 'Drafts' },
    { value: 'awaiting_accept', label: 'Finding Contractor' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Start by creating your first job' : `No jobs with status "${filter}"`}
            </p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
              <JobCard job={job} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Settings: React.FC<{ user: User }> = ({ user }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
    
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={user.firstName}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={user.lastName}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={user.phone || ''}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          {[
            { id: 'email', label: 'Email notifications' },
            { id: 'sms', label: 'SMS notifications' },
            { id: 'push', label: 'Push notifications' },
            { id: 'marketing', label: 'Marketing updates' }
          ].map(({ id, label }) => (
            <label key={id} className="flex items-center">
              <input type="checkbox" className="mr-3" defaultChecked={id !== 'marketing'} />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <button className="text-blue-600 hover:text-blue-700 text-sm">
            Change password
          </button>
          <button className="text-blue-600 hover:text-blue-700 text-sm block">
            Download my data
          </button>
          <button className="text-red-600 hover:text-red-700 text-sm block">
            Delete account
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGetStarted = () => {
    setUser(mockUser);
    setCurrentView('dashboard');
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    setCurrentView('jobs');
  };

  const renderContent = () => {
    if (!user && currentView === 'landing') {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    if (!user) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} jobs={jobs} />;
      case 'new-job':
        return <NewJobForm onJobCreated={handleJobCreated} />;
      case 'jobs':
        return <JobsList jobs={jobs} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Dashboard user={user} jobs={jobs} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {user && (
          <Sidebar
            isOpen={sidebarOpen}
            currentView={currentView}
            onViewChange={setCurrentView}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;