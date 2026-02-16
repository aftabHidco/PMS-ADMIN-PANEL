import React, { useEffect, useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormInput,
  CFormSelect,
  CButton,
  CAlert,
  CRow,
  CCol,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import { useAuth } from "../../auth/AuthProvider";

const CreateBooking = () => {
  const auth = useAuth();
  const API_BASE = auth.API_BASE;
  const loggedUser = auth.user;

  // ---------------- STATE ----------------
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchPhone, setSearchPhone] = useState("");
  const [user, setUser] = useState(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [availabilityOptions, setAvailabilityOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const [booking, setBooking] = useState({
    property_id: "",
    room_type_id: "",
    start_date: "",
    end_date: "",
    rooms: 1,
    guests: 1,
  });

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const today = new Date().toISOString().split("T")[0];

  // ---------------- LOAD PROPERTIES (ROLE BASED) ----------------
  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=200`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => {
        const all = d.data || d;

        if (
          loggedUser?.role === "super_admin" ||
          loggedUser?.Role?.role_name === "super_admin"
        ) {
          setProperties(all);
        } else {
          const filtered = all.filter(
            (p) => p.property_id === loggedUser.property_id
          );
          setProperties(filtered);
          if (filtered.length === 1) {
            setBooking((b) => ({
              ...b,
              property_id: filtered[0].property_id,
            }));
          }
        }
      });
  }, []);

  // ---------------- SEARCH USER ----------------
  const searchUser = async () => {
    setError("");
    setUser(null);
    setUserNotFound(false);
    setAvailabilityOptions([]);
    setSelectedOption(null);

    if (!searchPhone) {
      setError("Enter mobile number");
      return;
    }

    const res = await fetch(
      `${API_BASE}/users/search?q=${searchPhone}`,
      { headers: auth.getAuthHeader() }
    );

    const data = await res.json();

    if (data?.data?.length) {
      setUser(data.data[0]);
    } else {
      setUserNotFound(true);
      setNewUser({ phone: searchPhone, full_name: "", email: "" });
    }
  };

  // ---------------- CREATE USER ----------------
  const createUser = async () => {
    setError("");

    const password = `${newUser.full_name.split(" ")[0]}@1234`;

    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify({ ...newUser, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to create user");
      return;
    }

    setUser(data.data);
    setShowUserModal(false);
    setUserNotFound(false);
    setSuccess("User created successfully");
  };

  // ---------------- LOAD ROOM TYPES ----------------
  useEffect(() => {
    if (!booking.property_id) return;

    fetch(`${API_BASE}/room-types?property_id=${booking.property_id}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => setRoomTypes(d.data || d));
  }, [booking.property_id]);

  // ---------------- CHECK AVAILABILITY (GET API) ----------------
  const checkAvailability = async () => {
    setError("");
    setAvailabilityOptions([]);
    setSelectedOption(null);

    const { property_id, start_date, end_date, guests, rooms } = booking;
    const numGuests = Number(guests);
    const numRooms = Number(rooms);

    if (!property_id || !start_date || !end_date || !numGuests || !numRooms) {
      setError("Fill all booking details");
      return;
    }

    const query = new URLSearchParams({
      property_id,
      checkin_date: start_date,
      checkout_date: end_date,
      num_guests: String(numGuests),
      num_rooms: String(numRooms),
      guests: String(numGuests),
      rooms: String(numRooms),
    }).toString();

    const res = await fetch(`${API_BASE}/availability?${query}`, {
      headers: auth.getAuthHeader(),
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.options?.length) {
      setError("No rooms available");
      return;
    }

    setAvailabilityOptions(data.options);
  };

  // ---------------- CREATE BOOKING ----------------
  const createBooking = async () => {
    setError("");

    if (!selectedOption) {
      setError("Please select an availability option");
      return;
    }

    const pricing = selectedOption?.pricing || {};
    const payload = {
      user_id: Number(user.user_id),
      property_id: Number(booking.property_id),
      checkin_date: booking.start_date,
      checkout_date: booking.end_date,
      num_guests: Number(booking.guests),
      tax_amount: Number(pricing.tax_amount || 0),
      pricing_summary: {
        base_price: Number(pricing.base_price || 0),
        tax_amount: Number(pricing.tax_amount || 0),
        grand_total: Number(pricing.total_price || 0),
        taxes: (pricing.taxes || []).map((tax) => ({
          tax_id: Number(tax.tax_id),
          tax_name: tax.tax_name,
          tax_code: tax.tax_code,
          percentage: Number(tax.percentage),
          amount: Number(tax.amount),
        })),
        breakup: (pricing.breakup || []).map((item) => ({
          room_type_id: Number(item.room_type_id),
          qty: Number(item.qty),
          price_per_night: Number(item.price_per_night),
          subtotal: Number(item.subtotal),
        })),
      },
    };

    const res = await fetch(`http://127.0.0.1:4000/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data?.success) {
      setError(data?.message || "Booking failed");
      return;
    }

    const baseUrl = window.location.href.split("#")[0];
    window.location.replace(`${baseUrl}#/bookings`);
  };

  // ---------------- UI ----------------
  return (
    <CCard>
      <CCardHeader><h4>Create Booking</h4></CCardHeader>
      <CCardBody>

        {error && <CAlert color="danger">{error}</CAlert>}
        {success && <CAlert color="success">{success}</CAlert>}

        {/* STEP 1 — USER */}
        <h5>1. Search User</h5>
        <CRow className="mb-3">
          <CCol md={4}>
            <CFormInput
              label="Mobile Number"
              value={searchPhone}
              disabled={!!user}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </CCol>
          <CCol md={2} className="d-flex align-items-end">
            <CButton onClick={searchUser} disabled={!!user}>Search</CButton>
          </CCol>
        </CRow>

        {user && (
          <CAlert color="info">
            Selected User: <strong>{user.full_name}</strong> ({user.phone})
          </CAlert>
        )}

        {userNotFound && (
          <CAlert color="warning">
            User not found.
            <CButton size="sm" className="ms-3" onClick={() => setShowUserModal(true)}>
              Create User
            </CButton>
          </CAlert>
        )}

        {/* STEP 2 — BOOKING */}
        {user && (
          <>
            <h5 className="mt-4">2. Booking Details</h5>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Property"
                  value={booking.property_id}
                  disabled={loggedUser?.Role?.role_name === "admin"}
                  onChange={(e) =>
                    setBooking({ ...booking, property_id: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {properties.map(p => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.property_name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormSelect
                  label="Room Type"
                  value={booking.room_type_id}
                  onChange={(e) =>
                    setBooking({ ...booking, room_type_id: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {roomTypes.map(r => (
                    <option key={r.room_type_id} value={r.room_type_id}>
                      {r.room_type_name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={3}>
                <CFormInput type="date" label="Check-in"
                  min={today}
                  value={booking.start_date}
                  onChange={e => setBooking({ ...booking, start_date: e.target.value })}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput type="date" label="Check-out"
                  min={booking.start_date || today}
                  value={booking.end_date}
                  onChange={e => setBooking({ ...booking, end_date: e.target.value })}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput type="number" label="Rooms"
                  value={booking.rooms}
                  onChange={e => setBooking({ ...booking, rooms: e.target.value })}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput type="number" label="Guests"
                  value={booking.guests}
                  onChange={e => setBooking({ ...booking, guests: e.target.value })}
                />
              </CCol>
            </CRow>

            <CButton color="warning" onClick={checkAvailability}>
              Check Availability
            </CButton>

            {/* AVAILABILITY OPTIONS */}
            {/* AVAILABILITY OPTIONS WITH PRICE */}
{availabilityOptions.length > 0 && (
  <>
    <h6 className="mt-4">Available Options</h6>

    {availabilityOptions.map((opt, idx) => (
      <CAlert
        key={idx}
        color={selectedOption === opt ? "success" : "secondary"}
        className="mb-3"
      >
        {/* BASIC INFO */}
        <div className="mb-2">
          <strong>Fit Type:</strong> {opt.fit_type.toUpperCase()} <br />
          <strong>Total Rooms:</strong> {opt.room_count} <br />
          <strong>Total Guests:</strong> {opt.total_occupancy}
        </div>

        {/* PRICE BREAKUP TABLE */}
        {opt.pricing && (
          <div className="border rounded p-2 mb-2 bg-light">
            <strong>Price Breakdown</strong>

            {opt.pricing.breakup.map((b, i) => (
              <div key={i} className="mt-2">
                <div><strong>{b.room_type_name}</strong></div>
                <div>
                  Qty: {b.qty} × Nights: {b.nights}
                </div>
                <div>
                  Price / Night: ₹{b.price_per_night}
                </div>
                <div>
                  Subtotal: <strong>₹{b.subtotal}</strong>
                </div>
              </div>
            ))}

            <hr />
            <div className="d-flex justify-content-between">
              <span>Base Price</span>
              <span>₹{opt.pricing.base_price}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Total Tax</span>
              <span>₹{opt.pricing.tax_amount}</span>
            </div>
            {Array.isArray(opt.pricing.taxes) && opt.pricing.taxes.length > 0 && (
              <div className="mt-2">
                {opt.pricing.taxes.map((tax, taxIdx) => (
                  <div key={taxIdx} className="d-flex justify-content-between">
                    <span>{tax.tax_name} ({tax.percentage}%)</span>
                    <span>₹{tax.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <hr />
            <div className="d-flex justify-content-between">
              <strong>Total Price</strong>
              <strong>
                ₹{opt.pricing.total_price} {opt.pricing.currency}
              </strong>
            </div>
          </div>
        )}

        {/* SELECT BUTTON */}
        <div className="d-flex justify-content-end">
          <CButton
            size="sm"
            color="primary"
            onClick={() => {
              setSelectedOption(opt);
              setBooking({
                ...booking,
                room_type_id: opt.pricing.breakup[0].room_type_id,
              });
            }}
          >
            Select This Option
          </CButton>
        </div>
      </CAlert>
    ))}
  </>
)}


            {selectedOption && (
              <CButton className="mt-3" color="success" onClick={createBooking}>
                Book Now
              </CButton>
            )}
          </>
        )}
      </CCardBody>

      {/* CREATE USER MODAL */}
      <CModal visible={showUserModal} onClose={() => setShowUserModal(false)}>
        <CModalHeader>Create User</CModalHeader>
        <CModalBody>
          <CFormInput label="Mobile" value={newUser.phone} disabled />
          <CFormInput
            label="Full Name"
            className="mt-2"
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
          />
          <CFormInput
            label="Email"
            className="mt-2"
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={createUser}>Create User</CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  );
};

export default CreateBooking;
