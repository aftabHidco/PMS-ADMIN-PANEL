// src/views/properties/PropertyEdit.js
import React, { useEffect, useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CButton,
  CAlert,
  CRow,
  CCol,
} from "@coreui/react";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";

const PropertyEdit = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const API_BASE = auth.API_BASE;

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/properties/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader(),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const p = data?.data || data;
        setForm(p);
      })
      .catch(() => setError("Failed to load property"));
  }, []);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update property");
        return;
      }

      navigate("/properties");
    } catch (err) {
      setError("Failed to update property");
    }
  };

  if (!form) return <h4 className="p-3">Loading...</h4>;

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit Property</h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormInput
                label="Property Name"
                value={form.property_name}
                onChange={(e) => handleChange("property_name", e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Property Code"
                value={form.property_code}
                onChange={(e) => handleChange("property_code", e.target.value)}
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormInput
                label="Address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="City"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="State"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="Country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="Pincode"
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
              />
            </CCol>
          </CRow>

          <CButton color="primary" type="submit">
            Update Property
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default PropertyEdit;
