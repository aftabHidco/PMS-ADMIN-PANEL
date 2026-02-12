// src/views/roomTypes/RoomTypeImages.js
import React, { useEffect, useState } from "react";
import {
  CButton,
  CFormInput,
  CRow,
  CCol,
  CCard,
  CCardBody
} from "@coreui/react";
import { useAuth } from "../../auth/AuthProvider";

const RoomTypeImages = ({ roomTypeId }) => {
  const auth = useAuth();
  const API_BASE = auth.API_BASE;

  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  // ------------------------------------------------
  // Load existing room-type images from backend
  // ------------------------------------------------
  const loadImages = async () => {
    try {
      const res = await fetch(`${API_BASE}/room-types/${roomTypeId}/images`, {
        headers: auth.getAuthHeader(),
      });

      const data = await res.json();

      const list = Array.isArray(data) ? data : data.data;
      setUploadedImages(Array.isArray(list) ? list : []);

    } catch (err) {
      console.error("Failed to load images", err);
      setUploadedImages([]);
    }
  };

  useEffect(() => {
    loadImages();
  }, [roomTypeId]);

  // ------------------------------------------------
  // Select images (Preview before upload)
  // ------------------------------------------------
  const handleSelectImages = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...previews]);
  };

  // Remove selected preview before uploading
  const removeSelectedImage = (index) => {
    const updated = [...selectedImages];
    updated.splice(index, 1);
    setSelectedImages(updated);
  };

  // ------------------------------------------------
  // Upload selected images
  // ------------------------------------------------
  const uploadSelectedImages = async () => {
    if (selectedImages.length === 0) {
      alert("Please select images first!");
      return;
    }

    const formData = new FormData();
    selectedImages.forEach((img) => formData.append("images", img.file));

    try {
      await fetch(`${API_BASE}/room-types/${roomTypeId}/images`, {
        method: "POST",
        headers: auth.getAuthHeader(),
        body: formData,
      });

      setSelectedImages([]);
      loadImages();

    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // ------------------------------------------------
  // Delete image (Correct API route)
  // ------------------------------------------------
  const deleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await fetch(`${API_BASE}/room-types/${roomTypeId}/images/${imageId}`, {
        method: "DELETE",
        headers: auth.getAuthHeader(),
      });

      loadImages();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <CCard className="mt-3">
      <CCardBody>
        <h5>Room Images</h5>
        <p>Select images to preview before uploading.</p>

        {/* File Picker */}
        <CFormInput type="file" multiple onChange={handleSelectImages} />

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <>
            <h6 className="mt-3">Selected Images (Not Yet Uploaded)</h6>
            <CRow className="mt-2">
              {selectedImages.map((img, idx) => (
                <CCol md={3} key={idx} className="mb-3">
                  <img
                    src={img.preview}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "2px solid #0d6efd"
                    }}
                  />

                  <CButton
                    color="danger"
                    size="sm"
                    className="mt-2 w-100"
                    onClick={() => removeSelectedImage(idx)}
                  >
                    Remove
                  </CButton>
                </CCol>
              ))}
            </CRow>

            <CButton color="primary" className="mt-2" onClick={uploadSelectedImages}>
              Upload Selected Images
            </CButton>
          </>
        )}

        <hr />

        {/* Uploaded Images */}
        <h6>Uploaded Images</h6>
        <CRow className="mt-2">
          {uploadedImages.map((img) => (
            <CCol md={3} key={img.image_id} className="mb-3">
              <img
                src={img.image_url}
                alt=""
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 6
                }}
              />

              <CButton
                color="danger"
                size="sm"
                className="mt-2 w-100"
                onClick={() => deleteImage(img.image_id)}
              >
                Delete
              </CButton>
            </CCol>
          ))}
        </CRow>

      </CCardBody>
    </CCard>
  );
};

export default RoomTypeImages;
