import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Users, Clock, CheckCircle } from "lucide-react";
import Button from "./Button";
import {
  AIRDROP_DISTRIBUTION_TYPES,
  type AirdropConfig,
  type AirdropEligibilityCriteria,
} from "../lib/sdk";

interface AirdropCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: AirdropConfig, amount: number) => void;
  eventName: string;
  loading?: boolean;
}

const AirdropCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  eventName,
  loading = false,
}: AirdropCreationModalProps) => {
  const [formData, setFormData] = useState<AirdropConfig>({
    name: "",
    description: "",
    distributionType: AIRDROP_DISTRIBUTION_TYPES.EQUAL_DISTRIBUTION,
    eligibility: {
      requireAttendance: true,
      requireCompletion: false,
      minDuration: 0,
      requireRatingSubmitted: false,
    },
    validityDays: 30,
  });

  const [amount, setAmount] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const distributionTypeOptions = [
    {
      value: AIRDROP_DISTRIBUTION_TYPES.EQUAL_DISTRIBUTION,
      label: "Equal Distribution",
      description: "Same amount for all eligible participants",
      icon: Users,
    },
    {
      value: AIRDROP_DISTRIBUTION_TYPES.WEIGHTED_BY_DURATION,
      label: "Duration Weighted",
      description: "Amount based on attendance duration",
      icon: Clock,
    },
    {
      value: AIRDROP_DISTRIBUTION_TYPES.COMPLETION_BONUS,
      label: "Completion Bonus",
      description: "Bonus for full event completion",
      icon: CheckCircle,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Airdrop name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (formData.validityDays <= 0 || formData.validityDays > 365) {
      newErrors.validityDays = "Validity must be between 1 and 365 days";
    }

    if (formData.eligibility.minDuration < 0) {
      newErrors.minDuration = "Minimum duration cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData, parseFloat(amount));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        description: "",
        distributionType: AIRDROP_DISTRIBUTION_TYPES.EQUAL_DISTRIBUTION,
        eligibility: {
          requireAttendance: true,
          requireCompletion: false,
          minDuration: 0,
          requireRatingSubmitted: false,
        },
        validityDays: 30,
      });
      setAmount("");
      setErrors({});
      onClose();
    }
  };

  const updateEligibility = (
    field: keyof AirdropEligibilityCriteria,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        [field]: value,
      },
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card backdrop-blur-2xl border border-border shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col items-center justify-center pt-8 pb-4 bg-gradient-to-r from-primary/80 to-secondary/80 flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="h-8 w-8 text-white" />
                <h3 className="text-2xl font-bold text-white drop-shadow font-livvic">
                  Create Airdrop Campaign
                </h3>
              </div>
              <p className="text-white/80 text-sm mb-2 font-open-sans">
                Reward participants for {eventName}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="px-8 py-6 space-y-6 overflow-y-auto flex-1"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground font-livvic">
                  Campaign Details
                </h4>

                <div>
                  <label className="text-foreground-secondary text-sm font-semibold mb-2 block font-livvic">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full p-3 rounded-lg border ${
                      errors.name ? "border-red-500" : "border-border"
                    } bg-card-secondary text-foreground focus:ring-2 focus:ring-primary/40 outline-none`}
                    placeholder="e.g., Post-Event Reward"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-foreground-secondary text-sm font-semibold mb-2 block font-livvic">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border ${
                      errors.description ? "border-red-500" : "border-border"
                    } bg-card-secondary text-foreground focus:ring-2 focus:ring-primary/40 outline-none`}
                    rows={3}
                    placeholder="Describe what this airdrop is for..."
                    disabled={loading}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-foreground-secondary text-sm font-semibold mb-2 block font-livvic">
                    Total Amount (SUI) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full p-3 rounded-lg border ${
                      errors.amount ? "border-red-500" : "border-border"
                    } bg-card-secondary text-foreground focus:ring-2 focus:ring-primary/40 outline-none`}
                    placeholder="0.0"
                    disabled={loading}
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
              </div>

              {/* Distribution Type */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground font-livvic">
                  Distribution Strategy
                </h4>

                <div className="grid gap-3">
                  {distributionTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.distributionType === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card-secondary hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="distributionType"
                          value={option.value}
                          checked={formData.distributionType === option.value}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              distributionType: parseInt(e.target.value) as any,
                            }))
                          }
                          className="mt-1"
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-secondary">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground font-livvic">
                  Eligibility Requirements
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eligibility.requireAttendance}
                      onChange={(e) =>
                        updateEligibility("requireAttendance", e.target.checked)
                      }
                      className="rounded"
                      disabled={loading}
                    />
                    <span className="text-foreground">
                      Require event attendance (check-in)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eligibility.requireCompletion}
                      onChange={(e) =>
                        updateEligibility("requireCompletion", e.target.checked)
                      }
                      className="rounded"
                      disabled={loading}
                    />
                    <span className="text-foreground">
                      Require event completion (check-out)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eligibility.requireRatingSubmitted}
                      onChange={(e) =>
                        updateEligibility(
                          "requireRatingSubmitted",
                          e.target.checked
                        )
                      }
                      className="rounded"
                      disabled={loading}
                    />
                    <span className="text-foreground">
                      Require event rating submission
                    </span>
                  </label>

                  <div>
                    <label className="text-foreground-secondary text-sm font-semibold mb-2 block font-livvic">
                      Minimum Attendance Duration (hours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={
                        isNaN(
                          formData.eligibility.minDuration / (1000 * 60 * 60)
                        )
                          ? "0"
                          : (
                              formData.eligibility.minDuration /
                              (1000 * 60 * 60)
                            ).toString()
                      }
                      onChange={(e) =>
                        updateEligibility(
                          "minDuration",
                          parseFloat(e.target.value || "0") * 1000 * 60 * 60
                        )
                      }
                      className={`w-full p-3 rounded-lg border ${
                        errors.minDuration ? "border-red-500" : "border-border"
                      } bg-card-secondary text-foreground focus:ring-2 focus:ring-primary/40 outline-none`}
                      placeholder="0"
                      disabled={loading}
                    />
                    {errors.minDuration && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.minDuration}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div>
                <label className="text-foreground-secondary text-sm font-semibold mb-2 block font-livvic">
                  Campaign Validity (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.validityDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validityDays: parseInt(e.target.value),
                    }))
                  }
                  className={`w-full p-3 rounded-lg border ${
                    errors.validityDays ? "border-red-500" : "border-border"
                  } bg-card-secondary text-foreground focus:ring-2 focus:ring-primary/40 outline-none`}
                  placeholder="30"
                  disabled={loading}
                />
                {errors.validityDays && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.validityDays}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl shadow-lg hover:from-secondary hover:to-primary transition-all text-base min-w-0 font-livvic"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Airdrop...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Create Airdrop
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 border-0 bg-card-secondary text-foreground font-semibold py-3 rounded-xl hover:bg-card transition-all text-base min-w-0 font-livvic"
                >
                  Cancel
                </Button>
              </div>
            </form>

            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AirdropCreationModal;
