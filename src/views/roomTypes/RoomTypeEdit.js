// src/views/roomTypes/RoomTypeEdit.js
import React, { useEffect, useState } from "react";
import {
  CCard, CCardBody, CCardHeader, CForm, CFormInput, CFormTextarea,
  CFormSelect, CButton, CAlert, CRow, CCol,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane
} from "@coreui/react";

import { useAuth } from "../../auth/AuthProvider";
import { useParams } from "react-router-dom";

import RoomTypeImages from "./RoomTypeImages";
import RoomTypePricing from "./RoomTypePricing";

const RoomTypeEdit = () => {
  const { id } = useParams();
  const auth = useAuth();
  const API_BASE = auth.API_BASE;

  const [activeTab, setActiveTab] = useState(1);
  const [roomTypeId] = useState(id);

  const [properties, setProperties] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [roomTypeName, setRoomTypeName] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    property_id: "",
    room_type_code: "",
    room_type_name: "",
    base_occupancy: "",
    max_occupancy: "",
    qty: "",
    inventory_mode: "static",
    description: "",
  });

  // ---------------------------------------
  // Load PROPERTIES
  // ---------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=200`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => {
        const props = d.data || d;
        setProperties(props);

        // If form already has property id, map the name
        const found = props.find((p) => p.property_id == form.property_id);
        if (found) setPropertyName(found.property_name);
      });
  }, [form.property_id]);

  // ---------------------------------------
  // Load ROOM TYPE DATA
  // ---------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/room-types/${id}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => {
        setForm({
          property_id: d.property_id,
          room_type_code: d.room_type_code,
          room_type_name: d.room_type_name,
          base_occupancy: d.base_occupancy,
          max_occupancy: d.max_occupancy,
          qty: d.qty,
          inventory_mode: d.inventory_mode,
          description: d.description,
        });

        setRoomTypeName(d.room_type_name);

        // Try to match property name if properties already loaded
        const match = properties.find((p) => p.property_id === d.property_id);
        if (match) setPropertyName(match.property_name);
      })
      .catch(() => setError("Failed to load room type"));
  }, []);

  // ---------------------------------------
  // Change Handler
  // ---------------------------------------
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // ---------------------------------------
  // Submit Handler
  // ---------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/room-types/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }

      alert("Room Type updated successfully");

      // Update header title live
      const p = properties.find((x) => x.property_id == form.property_id);
      if (p) setPropertyName(p.property_name);
      setRoomTypeName(form.room_type_name);

    } catch (err) {
      setError("Failed to update room type");
    }
  };

  return (
    <CCard>
      <CCardHeader>
        <h4>
          Edit Room Type
          {propertyName && roomTypeName ? ` — ${propertyName} / ${roomTypeName}` : ""}
        </h4>
      </CCardHeader>

      <CCardBody>

        {/* TABS */}
        <CNav variant="tabs">
          <CNavItem>
            <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)}>
              Details
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink active={activeTab === 2} onClick={() => setActiveTab(2)}>
              Images
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink active={activeTab === 3} onClick={() => setActiveTab(3)}>
              Pricing
            </CNavLink>
          </CNavItem>
        </CNav>

        <CTabContent>

          {/* ---------------- TAB 1: DETAILS ---------------- */}
          <CTabPane visible={activeTab === 1}>
            {error && <CAlert color="danger">{error}</CAlert>}

            <CForm onSubmit={handleSubmit} className="mt-3">

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect
                    label="Property"
                    value={form.property_id}
                    onChange={(e) => handleChange("property_id", e.target.value)}
                  >
                    {properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    label="Room Type Code"
                    value={form.room_type_code}
                    onChange={(e) => handleChange("room_type_code", e.target.value)}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormInput
                    label="Room Type Name"
                    required
                    value={form.room_type_name}
                    onChange={(e) => handleChange("room_type_name", e.target.value)}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Base Occupancy"
                    value={form.base_occupancy}
                    onChange={(e) => handleChange("base_occupancy", e.target.value)}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Max Occupancy"
                    value={form.max_occupancy}
                    onChange={(e) => handleChange("max_occupancy", e.target.value)}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Quantity"
                    value={form.qty}
                    onChange={(e) => handleChange("qty", e.target.value)}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput label="Inventory Mode" value="static" disabled />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormTextarea
                    label="Description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </CCol>
              </CRow>

              <CButton type="submit" color="primary">
                Update Room Type
              </CButton>

            </CForm>
          </CTabPane>

          {/* ---------------- TAB 2: IMAGES ---------------- */}
          <CTabPane visible={activeTab === 2}>
            <RoomTypeImages roomTypeId={roomTypeId} />
          </CTabPane>

          {/* ---------------- TAB 3: PRICING ---------------- */}
          <CTabPane visible={activeTab === 3}>
            <RoomTypePricing roomTypeId={roomTypeId} />
          </CTabPane>

        </CTabContent>
      </CCardBody>
    </CCard>
  );
};

export default RoomTypeEdit;
