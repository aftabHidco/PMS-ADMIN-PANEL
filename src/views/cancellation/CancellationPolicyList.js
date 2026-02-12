// src/views/cancellation/CancellationPolicyList.js
import React, { useEffect, useState } from "react";
import {
  CCard, CCardHeader, CCardBody,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CButton, CFormInput
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const CancellationPolicyList = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const API_BASE = auth.API_BASE;

  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");

  const loadPolicies = () => {
    fetch(`${API_BASE}/cancellation-policies?search=${search}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => setPolicies(d.data || d));
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleSearch = () => {
    loadPolicies();
  };

  const deletePolicy = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;

    await fetch(`${API_BASE}/cancellation-policies/${id}`, {
      method: "DELETE",
      headers: auth.getAuthHeader(),
    });

    loadPolicies();
  };

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Cancellation Policies</h4>
        <CButton color="primary" onClick={() => navigate("/cancellation/create")}>
          Create Policy
        </CButton>
      </CCardHeader>

      <CCardBody>

        <div className="d-flex mb-3" style={{ gap: 10 }}>
          <CFormInput
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CButton color="info" onClick={handleSearch}>Search</CButton>
        </div>

        <CTable striped>
            <CTableHead>
                <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
            </CTableHead>


          <CTableBody>
            {policies.map((p) => (
              <CTableRow key={p.id}>
                <CTableDataCell>{p.id}</CTableDataCell>
                <CTableDataCell>{p.name}</CTableDataCell>
                <CTableDataCell>{p.description}</CTableDataCell>

                <CTableDataCell>
                  <CButton
                    size="sm"
                    color="info"
                    className="me-2"
                    onClick={() => navigate(`/cancellation/${p.id}/edit`)}
                  >
                    Edit
                  </CButton>

                  <CButton
                    size="sm"
                    color="danger"
                    onClick={() => deletePolicy(p.id)}
                  >
                    Delete
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>

      </CCardBody>
    </CCard>
  );
};

export default CancellationPolicyList;
