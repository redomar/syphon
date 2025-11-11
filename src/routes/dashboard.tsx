import { SignOutButton } from "@clerk/clerk-react";
import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
      </header>

      <div className="dashboard-actions">
        <SignOutButton />
      </div>

      <main className="dashboard-content">
        <section className="samples-section">
          <h2>Recent Samples</h2>
          <div className="samples-grid">
            <div className="sample-card">
              <h3>Sample 1</h3>
              <p>Description of sample 1</p>
              <span className="sample-status">Active</span>
            </div>
            <div className="sample-card">
              <h3>Sample 2</h3>
              <p>Description of sample 2</p>
              <span className="sample-status">Pending</span>
            </div>
            <div className="sample-card">
              <h3>Sample 3</h3>
              <p>Description of sample 3</p>
              <span className="sample-status">Completed</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
