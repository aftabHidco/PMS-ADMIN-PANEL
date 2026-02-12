// src/views/seasons/SeasonCreate.js
import React, { useEffect, useState } from "react";
import {
  CCard, CCardHeader, CCardBody, CForm, CFormInput,
  CFormSelect, CButton, CAlert, CRow, CCol
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

// ✅ Month label + value
const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const SeasonCreate = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const API_BASE = auth.API_BASE;

  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    property_id: "",
    season_name: "",
    start_date: "", // stores 01,02,...
    end_date: "",
    is_peak: false,
  });

  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=200`, {
      headers: auth.getAuthHeader(),
    })
      .then((res) => res.json())
      .then((data) => setProperties(data.data || []));
  }, []);

  const handleChange = (key, value) =>
    setForm({ ...form, [key]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API_BASE}/seasons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || data.message || "Failed to create season");
      return;
    }

    navigate("/seasons");
  };

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Season</h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>

          {/* Property + Season Name */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect
                label="Property"
                required
                value={form.property_id}
                onChange={(e) => handleChange("property_id", e.target.value)}
              >
                <option value="">Select Property</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.property_name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Season Name"
                required
                value={form.season_name}
                onChange={(e) => handleChange("season_name", e.target.value)}
              />
            </CCol>
          </CRow>

          {/* Start & End Month */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect
                label="Start Month"
                required
                value={form.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              >
                <option value="">Select Month</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormSelect
                label="End Month"
                required
                value={form.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              >
                <option value="">Select Month</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {/* Season Type */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect
                label="Season Type"
                value={form.is_peak}
                onChange={(e) =>
                  handleChange("is_peak", e.target.value === "true")
                }
              >
                <option value="false">Normal Season</option>
                <option value="true">Peak Season</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CButton type="submit" color="primary">
            Save Season
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default SeasonCreate;
