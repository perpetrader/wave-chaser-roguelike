import React from "react";
import { BeachType } from "./BeachSelectionScreen";
import { BEACH_COLORS } from "./beachColors";

interface BeachFrameProps {
  beachType: BeachType | null;
  children: React.ReactNode;
  className?: string;
}

const BeachFrame: React.FC<BeachFrameProps> = ({ beachType, children, className = "" }) => {
  if (!beachType) {
    return <>{children}</>;
  }

  const borderColor = BEACH_COLORS[beachType].borderSolid;

  return (
    <div className={`border-2 ${borderColor} rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default BeachFrame;
