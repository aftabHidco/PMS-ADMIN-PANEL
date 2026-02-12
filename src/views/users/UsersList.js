// src/views/users/UsersList.js
import React, { useEffect, useMemo, useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CFormInput,
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const UsersList = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const API_BASE = auth.API_BASE;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, sorting, pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // ------------------------------------------------------------
  // Fetch Users
  // ------------------------------------------------------------
  const fetchUsers = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/users?_page=1&_perPage=200`, {
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeader(),
        },
      });

      const data = await res.json();
      setUsers(data?.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ------------------------------------------------------------
  // Search Filter Logic
  // ------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const text = `${u.full_name} ${u.email} ${u.phone}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [search, users]);

  // ------------------------------------------------------------
  // Sorting Logic
  // ------------------------------------------------------------
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let A = a[sortField] || "";
      let B = b[sortField] || "";

      if (typeof A === "string") A = A.toLowerCase();
      if (typeof B === "string") B = B.toLowerCase();

      if (sortDir === "asc") return A > B ? 1 : -1;
      return A < B ? 1 : -1;
    });
  }, [filteredUsers, sortDir, sortField]);

  // ------------------------------------------------------------
  // Pagination Logic
  // ------------------------------------------------------------
  const totalPages = Math.ceil(sortedUsers.length / perPage);

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice((page - 1) * perPage, page * perPage);
  }, [sortedUsers, page]);

  // ------------------------------------------------------------
  // Sorting Handler
  // ------------------------------------------------------------
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ------------------------------------------------------------
  // UI Rendering
  // ------------------------------------------------------------
  if (loading)
    return (
      <div className="text-center my-4">
        <CSpinner color="primary" />
      </div>
    );

  return (
    <CCard>
      <CCardHeader>
        <h4 className="d-flex justify-content-between align-items-center">
          Users
          <CButton
            color="primary"
            onClick={() => navigate("/users/create")}
          >
            + Create User
          </CButton>
        </h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        {/* Search Input */}
        <CFormInput
          placeholder="Search by name, email, phone..."
          className="mb-3"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <CTable bordered hover responsive>
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort("full_name")}>
                Name {sortField === "full_name" && (sortDir === "asc" ? "↑" : "↓")}
              </CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort("email")}>
                Email {sortField === "email" && (sortDir === "asc" ? "↑" : "↓")}
              </CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort("phone")}>
                Phone {sortField === "phone" && (sortDir === "asc" ? "↑" : "↓")}
              </CTableHeaderCell>

              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginatedUsers.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={5} className="text-center">
                  No users found
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginatedUsers.map((u, index) => (
                <CTableRow key={u.user_id}>
                  <CTableDataCell>
                    {(page - 1) * perPage + index + 1}
                  </CTableDataCell>

                  <CTableDataCell>{u.full_name}</CTableDataCell>
                  <CTableDataCell>{u.email}</CTableDataCell>
                  <CTableDataCell>{u.phone || "-"}</CTableDataCell>

                  <CTableDataCell>
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => navigate(`/users/${u.user_id}`)}
                    >
                      Edit
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        {/* Pagination */}
        <div className="d-flex justify-content-between mt-3">
          <CButton disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </CButton>

          <span>
            Page {page} of {totalPages}
          </span>

          <CButton
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default UsersList;
