/**
 * Modal sheet for free flap clinical details.
 * Wraps the existing FreeFlapClinicalFields in a DetailModuleSheet.
 */

import React, { useState, useEffect } from "react";
import { DetailModuleSheet } from "./DetailModuleSheet";
import {
  FreeFlapClinicalFields,
  type BreastFlapContext,
} from "@/components/ProcedureClinicalDetails";
import type { FreeFlapDetails } from "@/types/case";

interface FreeFlapSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (details: FreeFlapDetails) => void;
  initialDetails: FreeFlapDetails;
  procedureType: string;
  picklistEntryId?: string;
  priorRadiotherapy?: boolean;
  /** When set, configures breast-specific behavior (locked recipient site, IMA/IMV auto-fill, extension section) */
  breastContext?: BreastFlapContext;
}

export function FreeFlapSheet({
  visible,
  onClose,
  onSave,
  initialDetails,
  procedureType,
  picklistEntryId,
  priorRadiotherapy,
  breastContext,
}: FreeFlapSheetProps) {
  const [localDetails, setLocalDetails] =
    useState<FreeFlapDetails>(initialDetails);

  // Reset local state when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalDetails(initialDetails);
    }
  }, [visible, initialDetails]);

  const handleSave = () => {
    onSave(localDetails);
    onClose();
  };

  return (
    <DetailModuleSheet
      visible={visible}
      title="Flap Details"
      subtitle={breastContext ? `Breast free flap (${breastContext.side})` : "Free flap documentation"}
      onSave={handleSave}
      onCancel={onClose}
    >
      <FreeFlapClinicalFields
        clinicalDetails={localDetails}
        procedureType={procedureType}
        picklistEntryId={picklistEntryId}
        onUpdate={setLocalDetails}
        priorRadiotherapy={priorRadiotherapy}
        breastContext={breastContext}
      />
    </DetailModuleSheet>
  );
}
