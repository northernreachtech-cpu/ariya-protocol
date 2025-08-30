import React, { useState, useEffect } from 'react';
import { Search, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAriyaSDK } from '../lib/sdk';
import { useNetworkVariable } from '../config/sui';
import Button from './Button';

interface AssigneeSelectorProps {
  value: string;
  onChange: (assignee: string) => void;
  onValidationChange?: (isValid: boolean, address: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter assignee (address, @username, or t.me/username)",
  disabled = false,
  className = "",
}) => {
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  
  const [inputValue, setInputValue] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    address: string | null;
    error?: string;
    displayName?: string;
  } | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputValue.trim() && profileRegistryId) {
        setIsValidating(true);
        try {
          const result = await sdk.eventManagement.validateAssignee(inputValue.trim(), profileRegistryId);
          setValidationResult(result);
          onValidationChange?.(result.isValid, result.address);
        } catch (error) {
          console.error('Validation error:', error);
          setValidationResult({
            isValid: false,
            address: null,
            error: 'Validation failed',
          });
          onValidationChange?.(false, null);
        } finally {
          setIsValidating(false);
        }
      } else {
        setValidationResult(null);
        onValidationChange?.(false, null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue, profileRegistryId, sdk, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowValidation(true);
  };

  const handleSelectValidAssignee = () => {
    if (validationResult?.isValid && validationResult.address) {
      onChange(validationResult.address);
      setInputValue(validationResult.displayName || validationResult.address);
      setShowValidation(false);
    }
  };

  const getInputBorderColor = () => {
    if (!showValidation || !validationResult) return 'border-border';
    return validationResult.isValid ? 'border-green-500' : 'border-red-500';
  };

  const getInputBgColor = () => {
    if (!showValidation || !validationResult) return 'bg-card-secondary';
    return validationResult.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-4 w-4 text-foreground-muted" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 rounded-lg border transition-all duration-200
            ${getInputBorderColor()} ${getInputBgColor()}
            text-foreground placeholder-foreground-muted
            focus:ring-2 focus:ring-primary/40 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isValidating && (
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
          )}
          {!isValidating && validationResult && (
            <>
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Feedback */}
      {showValidation && validationResult && (
        <div className="mt-2">
          {validationResult.isValid ? (
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Valid assignee: {validationResult.displayName || validationResult.address}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectValidAssignee}
                className="text-xs"
              >
                Select
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {validationResult.error}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!showValidation && (
        <p className="mt-1 text-xs text-foreground-muted">
          Enter a wallet address, X username (@username), or Telegram username (t.me/username)
        </p>
      )}
    </div>
  );
};

export default AssigneeSelector;
