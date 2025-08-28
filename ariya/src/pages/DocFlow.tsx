import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Plus,
  Eye,
  Download,
  Send,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";

// Mock data for event-specific document flow
const mockEventDocFlow = {
  eventId: "event_123",
  eventName: "Tech Conference 2024",
  organizer: "0x1234...5678",
  approvalChain: [
    { address: "0x1111...", name: "Finance Manager", level: 1, role: "Budget Review" },
    { address: "0x2222...", name: "Department Head", level: 2, role: "Strategic Approval" },
    { address: "0x3333...", name: "CEO", level: 3, role: "Final Approval" },
  ],
  documents: [
    {
      id: "doc_1",
      title: "Event Budget Proposal",
      description: "Detailed budget breakdown for venue, catering, and marketing",
      type: "pdf",
      status: "approved",
      currentLevel: 3,
      submittedAt: "2024-01-15",
      approvedAt: "2024-01-18",
                  fundingAmount: "50,000 Sui",
      approvalHistory: [
        { reviewer: "Finance Manager", action: "approved", comments: "Budget looks reasonable", timestamp: "2024-01-16" },
        { reviewer: "Department Head", action: "approved", comments: "Strategic alignment confirmed", timestamp: "2024-01-17" },
        { reviewer: "CEO", action: "approved", comments: "Final approval granted", timestamp: "2024-01-18" },
      ]
    },
    {
      id: "doc_2",
      title: "Marketing Strategy Document",
      description: "Comprehensive marketing plan and budget allocation",
      type: "docx",
      status: "in_review",
      currentLevel: 2,
      submittedAt: "2024-01-20",
                  fundingAmount: "25,000 Sui",
      approvalHistory: [
        { reviewer: "Finance Manager", action: "approved", comments: "Marketing budget approved", timestamp: "2024-01-21" },
        { reviewer: "Department Head", action: "pending", comments: "", timestamp: "" },
      ]
    },
    {
      id: "doc_3",
      title: "Venue Contract",
      description: "Venue booking agreement and payment terms",
      type: "pdf",
      status: "pending",
      currentLevel: 1,
      submittedAt: "2024-01-22",
                  fundingAmount: "30,000 Sui",
      approvalHistory: [
        { reviewer: "Finance Manager", action: "pending", comments: "", timestamp: "" },
      ]
    }
  ]
};

const DocFlow = () => {
  const [selectedDocument, setSelectedDocument] = useState(mockEventDocFlow.documents[0]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 border-green-300 text-green-700";
      case "in_review": return "bg-blue-100 border-blue-300 text-blue-700";
      case "pending": return "bg-yellow-100 border-yellow-300 text-yellow-700";
      case "rejected": return "bg-red-100 border-red-300 text-red-700";
      default: return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "in_review": return <Clock className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-card/20 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Document Flow Management
              </h1>
              <p className="text-foreground-secondary mt-2">
                {mockEventDocFlow.eventName} • Approval Workflow
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowSetupModal(true)}>
                <Users className="h-4 w-4 mr-2" />
                Setup Approval Chain
              </Button>
              <Button onClick={() => setShowSubmitModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Document
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approval Chain */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Approval Chain
              </h3>
              <div className="space-y-3">
                {mockEventDocFlow.approvalChain.map((participant, index) => (
                  <motion.div
                    key={participant.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-card-secondary rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{participant.name}</p>
                      <p className="text-sm text-foreground-secondary">{participant.role}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        Level {participant.level}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Submitted Documents
              </h3>
              <div className="space-y-4">
                {mockEventDocFlow.documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedDocument?.id === doc.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card-secondary'
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📄</div>
                        <div>
                          <h4 className="font-semibold text-foreground">{doc.title}</h4>
                          <p className="text-sm text-foreground-secondary">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1 capitalize">{doc.status.replace('_', ' ')}</span>
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 border-green-300 text-green-700">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {doc.fundingAmount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-foreground-secondary">
                      <span>Submitted: {doc.submittedAt}</span>
                      <span>Level {doc.currentLevel} of {mockEventDocFlow.approvalChain.length}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-foreground-secondary mb-1">
                        <span>Approval Progress</span>
                        <span>{Math.round((doc.currentLevel / mockEventDocFlow.approvalChain.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(doc.currentLevel / mockEventDocFlow.approvalChain.length) * 100}%` }}
                          transition={{ delay: 0.5, duration: 1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Document Details */}
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  {selectedDocument.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Info */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Document Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedDocument.status)}`}>
                        {getStatusIcon(selectedDocument.status)}
                        <span className="ml-1 capitalize">{selectedDocument.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Funding Amount:</span>
                      <span className="font-medium text-foreground">{selectedDocument.fundingAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Submitted:</span>
                      <span className="text-foreground">{selectedDocument.submittedAt}</span>
                    </div>
                    {selectedDocument.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Approved:</span>
                        <span className="text-foreground">{selectedDocument.approvedAt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval History */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Approval History</h4>
                  <div className="space-y-3">
                    {selectedDocument.approvalHistory.map((record, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-card-secondary rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          record.action === 'approved' ? 'bg-green-500' : 
                          record.action === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{record.reviewer}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              record.action === 'approved' ? 'bg-green-100 text-green-700' :
                              record.action === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {record.action}
                            </span>
                          </div>
                          {record.comments && (
                            <p className="text-sm text-foreground-secondary">{record.comments}</p>
                          )}
                          {record.timestamp && (
                            <p className="text-xs text-foreground-muted mt-1">{record.timestamp}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Setup Approval Chain</h3>
            <p className="text-foreground-secondary mb-4">
              Configure the approval hierarchy for this event's documents.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-card-secondary rounded-lg">
                <p className="font-medium">Finance Manager</p>
                <p className="text-sm text-foreground-secondary">Level 1 - Budget Review</p>
              </div>
              <div className="p-3 bg-card-secondary rounded-lg">
                <p className="font-medium">Department Head</p>
                <p className="text-sm text-foreground-secondary">Level 2 - Strategic Approval</p>
              </div>
              <div className="p-3 bg-card-secondary rounded-lg">
                <p className="font-medium">CEO</p>
                <p className="text-sm text-foreground-secondary">Level 3 - Final Approval</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowSetupModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSetupModal(false)}>
                <Send className="h-4 w-4 mr-2" />
                Deploy Chain
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Submit Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Document Title</label>
                <input
                  type="text"
                  placeholder="Enter document title"
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  placeholder="Describe the document"
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Funding Amount (Sui)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Upload Document</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-foreground-muted mb-2" />
                  <p className="text-foreground-secondary">Click to upload or drag and drop</p>
                  <p className="text-xs text-foreground-muted">PDF, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSubmitModal(false)}>
                <Upload className="h-4 w-4 mr-2" />
                Submit Document
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocFlow;
