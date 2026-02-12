// src/views/cancellation/CancellationPolicyCreate.js
import React, { useState } from "react";
import {
  CCard, CCardBody, CCardHeader,
  CForm, CFormInput, CFormTextarea,
  CButton, CAlert
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const CancellationPolicyCreate = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const API_BASE = auth.API_BASE;

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    rules: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      created_by: auth.user?.id,
      ip_address: "auto", // backend will override
    };

    try {
      const res = await fetch(`${API_BASE}/cancellation-policies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }

      navigate("/cancellation");
    } catch (err) {
      setError("Failed to create");
    }
  };

  return (
    <CCard>
      <CCardHeader><h4>Create Cancellation Policy</h4></CCardHeader>
      <CCardBody>

        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>

          <CFormInput
            label="Policy Name"
            className="mb-3"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />

          <CFormTextarea
            label="Description"
            rows={3}
            className="mb-3"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <CFormTextarea
            label="Policy Rules (JSON / Text)"
            rows={5}
            className="mb-3"
            value={form.rules}
            onChange={(e) => handleChange("rules", e.target.value)}
          />

          <CButton type="submit" color="primary">Create</CButton>
        </CForm>

      </CCardBody>
    </CCard>
  );
};

export default CancellationPolicyCreate;
