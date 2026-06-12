import React from "react";
import { useNavigate } from "react-router-dom";
import { LeadAnalysisSection } from "../components/LeadAnalysisSection";

const AnalisisLeadsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <LeadAnalysisSection onBack={() => navigate("/")} />
    </div>
  );
};

export default AnalisisLeadsPage;
