import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Eye,
  Edit3,
  MessageSquare,
  CheckCircle,
  Send,
  Download,
  Plus,
  Search,
  Filter,
  Grid,
  List,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import UploadModal from "../components/UploadModal";

// Mock data for demonstration
const mockDocuments = [
  {
    id: "1",
    name: "Q4 Financial Report",
    type: "pdf",
    status: "review",
    progress: 75,
    stage: "edit",
    uploadedBy: "John Doe",
    uploadedAt: "2 hours ago",
    size: "2.4 MB",
    priority: "high",
    currentStage: "edit",
  },
  {
    id: "2",
    name: "Marketing Strategy 2024",
    type: "docx",
    status: "approved",
    progress: 100,
    stage: "distribute",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "1 hour ago",
    size: "1.8 MB",
    priority: "medium",
    currentStage: "distribute",
  },
  {
    id: "3",
    name: "Product Requirements",
    type: "pdf",
    status: "pending",
    progress: 25,
    stage: "review",
    uploadedBy: "Mike Chen",
    uploadedAt: "30 minutes ago",
    size: "3.1 MB",
    priority: "high",
    currentStage: "review",
  },
  {
    id: "4",
    name: "Legal Contract Draft",
    type: "pdf",
    status: "editing",
    progress: 60,
    stage: "collaborate",
    uploadedBy: "Lisa Park",
    uploadedAt: "45 minutes ago",
    size: "4.2 MB",
    priority: "urgent",
    currentStage: "collaborate",
  },
];

const pipelineStages = [
  {
    id: "upload",
    name: "Upload",
    icon: Upload,
    color: "from-blue-500 to-cyan-500",
    description: "Document ingestion",
  },
  {
    id: "review",
    name: "Review",
    icon: Eye,
    color: "from-purple-500 to-pink-500",
    description: "Initial assessment",
  },
  {
    id: "edit",
    name: "Edit",
    icon: Edit3,
    color: "from-orange-500 to-red-500",
    description: "Content modification",
  },
  {
    id: "collaborate",
    name: "Collaborate",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-500",
    description: "Team feedback",
  },
  {
    id: "approve",
    name: "Approve",
    icon: CheckCircle,
    color: "from-indigo-500 to-blue-500",
    description: "Final approval",
  },
  {
    id: "distribute",
    name: "Distribute",
    icon: Send,
    color: "from-teal-500 to-green-500",
    description: "Document delivery",
  },
];

const DocFlow = () => {
  const [allDocuments, setAllDocuments] = useState(mockDocuments);
  const [pipelineDocuments, setPipelineDocuments] = useState<any[]>([]);
  // const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState("pipeline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  // Simulate document movement through stages (only for pipeline documents)
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineDocuments(
        (prev) =>
          prev
            .map((doc) => {
              // Simulate random stage progression
              if (Math.random() < 0.15) {
                // 15% chance to move
                const currentIndex = pipelineStages.findIndex(
                  (stage) => stage.id === doc.currentStage
                );
                if (currentIndex < pipelineStages.length - 1) {
                  const nextStage = pipelineStages[currentIndex + 1];
                  return {
                    ...doc,
                    currentStage: nextStage.id,
                    stage: nextStage.id,
                    progress: Math.min(doc.progress + 25, 100),
                    status: getStatusForStage(nextStage.id),
                  };
                } else {
                  // Document completed pipeline, move to all documents
                  const completedDoc = {
                    ...doc,
                    currentStage: doc.currentStage, // Keep current stage
                    stage: doc.currentStage,
                    progress: 100,
                    status: getStatusForStage(doc.currentStage),
                  };
                  setAllDocuments((prev) => [completedDoc, ...prev]);
                  return null; // Remove from pipeline
                }
              }
              return doc;
            })
            .filter(Boolean) // Remove null documents
      );
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusForStage = (stageId: string) => {
    switch (stageId) {
      case "upload":
        return "pending";
      case "review":
        return "review";
      case "edit":
        return "editing";
      case "collaborate":
        return "collaborate";
      case "approve":
        return "approved";
      case "distribute":
        return "distributed";
      default:
        return "pending";
    }
  };

  const handleUpload = (file: File) => {
    console.log("Uploading file:", file.name);

    const newDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: file.name.split(".").pop() || "pdf",
      status: "pending",
      progress: 0,
      stage: "upload",
      uploadedBy: "You",
      uploadedAt: "Just now",
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      priority: "medium",
      currentStage: "upload",
    };

    console.log("New document:", newDocument);

    // Add to pipeline documents only
    setPipelineDocuments((prev) => {
      const updated = [newDocument, ...prev];
      console.log("Updated pipeline documents:", updated);
      return updated;
    });

    // Simulate document moving to review stage after 3 seconds
    setTimeout(() => {
      setPipelineDocuments((prev) =>
        prev.map((doc) =>
          doc.id === newDocument.id
            ? {
                ...doc,
                currentStage: "review",
                stage: "review",
                progress: 25,
                status: "review",
              }
            : doc
        )
      );
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-300";
      case "review":
        return "bg-blue-500/20 border-blue-500/30 text-blue-300";
      case "editing":
        return "bg-orange-500/20 border-orange-500/30 text-orange-300";
      case "collaborate":
        return "bg-green-500/20 border-green-500/30 text-green-300";
      case "approved":
        return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
      case "distributed":
        return "bg-purple-500/20 border-purple-500/30 text-purple-300";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 border-red-500/30 text-red-300";
      case "high":
        return "bg-orange-500/20 border-orange-500/30 text-orange-300";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-300";
      case "low":
        return "bg-green-500/20 border-green-500/30 text-green-300";
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-300";
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "docx":
        return "📝";
      case "xlsx":
        return "📊";
      case "pptx":
        return "📈";
      default:
        return "📄";
    }
  };

  const getStagePosition = (stageId: string) => {
    const index = pipelineStages.findIndex((stage) => stage.id === stageId);
    return index;
  };

  // Calculate visual position for documents in pipeline
  // const getDocumentPosition = (stageId: string) => {
  //   const stageIndex = getStagePosition(stageId);
  //   const stageWidth = 100 / pipelineStages.length; // Each stage takes equal width
  //   return stageIndex * stageWidth + stageWidth / 2; // Center of the stage
  // };

  // Get stage center position for absolute positioning
  // const getStageCenterPosition = (stageId: string) => {
  //   const stageIndex = getStagePosition(stageId);
  //   const containerWidth = 1200; // Approximate container width
  //   const stageWidth = containerWidth / pipelineStages.length;
  //   return stageIndex * stageWidth + stageWidth / 2;
  // };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/20 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Doc Flow Pipeline
              </h1>
              <p className="text-foreground-muted mt-2">
                {viewMode === "pipeline"
                  ? "Watch new documents flow through the pipeline"
                  : "All documents in active workflows"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("pipeline")}
                className={
                  viewMode === "pipeline"
                    ? "bg-primary/20 border-primary/50"
                    : ""
                }
              >
                <Grid className="h-4 w-4 mr-2" />
                Pipeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list" ? "bg-primary/20 border-primary/50" : ""
                }
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="review">Review</option>
              <option value="editing">Editing</option>
              <option value="collaborate">Collaborate</option>
              <option value="approved">Approved</option>
              <option value="distributed">Distributed</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Pipeline View */}
        {viewMode === "pipeline" && (
          <div className="space-y-8">
            {/* Pipeline Stages */}
            <div className="relative">
              {/* Pipeline Flow Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent transform -translate-y-1/2 rounded-full opacity-30"></div>

              {/* Debug Info */}
              <div className="text-foreground-muted text-sm mb-4">
                Pipeline Documents: {pipelineDocuments.length}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
                {pipelineStages.map((stage, index) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center cursor-pointer"
                    onMouseEnter={() => setActiveStage(stage.id)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    <div className="relative">
                      {/* Stage Node */}
                      <motion.div
                        className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${
                          stage.color
                        } flex items-center justify-center shadow-lg shadow-primary/25 mb-3 transition-all duration-300 ${
                          activeStage === stage.id ? "scale-110" : ""
                        }`}
                        animate={{
                          boxShadow:
                            activeStage === stage.id
                              ? `0 0 30px rgba(139, 92, 246, 0.5)`
                              : `0 4px 20px rgba(139, 92, 246, 0.25)`,
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <stage.icon className="h-6 w-6 text-white" />
                      </motion.div>

                      {/* Glow Effect */}
                      <div
                        className={`absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${
                          stage.color
                        } opacity-20 blur-xl transition-opacity duration-300 ${
                          activeStage === stage.id ? "opacity-40" : ""
                        }`}
                      ></div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1">
                      {stage.name}
                    </h3>
                    <p className="text-xs text-white/60">{stage.description}</p>

                    {/* Document Count */}
                    <div className="mt-2">
                      <motion.span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80"
                        animate={{
                          scale:
                            pipelineDocuments.filter(
                              (doc) => doc.currentStage === stage.id
                            ).length > 0
                              ? 1.1
                              : 1,
                        }}
                      >
                        {
                          pipelineDocuments.filter(
                            (doc) => doc.currentStage === stage.id
                          ).length
                        }
                      </motion.span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Documents in Pipeline */}
            <div className="relative h-64 mt-8 overflow-hidden">
              {/* Pipeline Flow Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent transform -translate-y-1/2 rounded-full opacity-30"></div>

              {/* Documents positioned at their stages */}
              <AnimatePresence>
                {pipelineDocuments.map((doc, index) => {
                  const stageIndex = getStagePosition(doc.currentStage);
                  const stageWidth = 100 / pipelineStages.length;
                  const leftPosition = Math.max(
                    5,
                    Math.min(95, stageIndex * stageWidth + stageWidth / 2)
                  );

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        left: `${leftPosition}%`,
                      }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="absolute top-1/2 w-56 transform -translate-x-1/2"
                      layout
                    >
                      <Card className="p-3 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer">
                        {/* Document Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-lg flex-shrink-0">
                              {getFileTypeIcon(doc.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-white text-xs truncate">
                                {doc.name}
                              </h3>
                              <p className="text-xs text-white/60">
                                {doc.size}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-xs font-medium border truncate max-w-16 ${getPriorityColor(
                                doc.priority
                              )}`}
                            >
                              {doc.priority}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-xs font-medium border truncate max-w-16 ${getStatusColor(
                                doc.status
                              )}`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/70">
                              Progress
                            </span>
                            <span className="text-xs text-white">
                              {doc.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${doc.progress}%` }}
                              transition={{ delay: 0.5, duration: 1 }}
                            />
                          </div>
                        </div>

                        {/* Document Info */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">By:</span>
                            <span className="text-white">{doc.uploadedBy}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Time:</span>
                            <span className="text-white">{doc.uploadedAt}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Floating Particles Effect */}
                        <div className="absolute inset-0 pointer-events-none">
                          <motion.div
                            className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full opacity-60"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.6, 0.8, 0.6],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          <motion.div
                            className="absolute bottom-2 left-2 w-1 h-1 bg-secondary rounded-full opacity-40"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.4, 0.8, 0.4],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>

                        {/* Stage Indicator */}
                        <div className="absolute top-1 left-1">
                          <motion.div
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                              pipelineStages.find(
                                (s) => s.id === doc.currentStage
                              )?.color || "from-gray-500 to-gray-600"
                            }`}
                            animate={{
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                "0 0 0 0 rgba(139, 92, 246, 0)",
                                "0 0 0 3px rgba(139, 92, 246, 0.3)",
                                "0 0 0 0 rgba(139, 92, 246, 0)",
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {allDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getFileTypeIcon(doc.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{doc.name}</h3>
                        <p className="text-sm text-white/60">
                          {doc.uploadedBy} • {doc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default DocFlow;
