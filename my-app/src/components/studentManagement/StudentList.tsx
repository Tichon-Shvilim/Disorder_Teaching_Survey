import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Edit,
  Search,
  Plus,
  Trash2,
  GraduationCap,
  Filter,
  FileText,
  History,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAllStudents,
  deleteStudent,
} from "./Api-Requests/StudentAPIService";
import type { Student } from "./Api-Requests/StudentAPIService";
import { getAllClasses } from "./Api-Requests/ClassAPIService";
import type { Class } from "./Api-Requests/ClassAPIService";
import { toast } from "react-toastify";
import { PermissionGate, usePermissions } from '../common';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Permission system - keeping hook for future use
  usePermissions();

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllStudents();
      const studentsData = response.data.map((student: Student) => ({
        ...student,
        age: calculateAge(student.DOB),
      }));
      setStudents(studentsData);
    } catch (err: unknown) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    try {
      const response = await getAllClasses();
      setClasses(response.data);
    } catch (err: unknown) {
      console.error("Error fetching classes:", err);
      // Don't show error toast for classes as it's not critical
    }
  }, []);

  // Helper function to get class name by ID
  const getClassNameById = (classId: string | { _id: string; classNumber: string }): string => {
    // Handle case where classId might be an object (for backward compatibility)
    const searchId = typeof classId === 'object' && classId !== null 
      ? classId._id || classId.classNumber
      : classId;
    
    const classItem = classes.find(c => c._id === searchId);
    return classItem ? classItem.classNumber : '';
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(studentId);
        setStudents(students.filter((student) => student._id !== studentId));
        toast.success("Student deleted successfully");
      } catch (err: unknown) {
        console.error("Error deleting student:", err);
        toast.error("Failed to delete student");
      }
    }
  };

  const handleViewDetails = (studentId: string) => {
    navigate(`${studentId}`);
  };

  const handleAddStudent = () => {
    navigate("../addStudent");
  };

  const handleEditStudent = (studentId: string) => {
    navigate(`${studentId}/edit`);
  };

  // const handleFillForm = (studentId: string, studentName: string) => {
  //   navigate(`../forms/fill`, { state: { studentId, studentName } });
  // };

  // const handleViewSubmissions = (studentId: string, studentName: string) => {
  //   navigate(`../forms/submissions`, { state: { studentId, studentName } });
  // };

  // V2 Form handlers
  const handleFillFormV2 = (studentId: string, studentName: string) => {
    navigate(`../forms/v2/fill`, { state: { studentId, studentName } });
  };

  const handleViewSubmissionsV2 = (studentId: string, studentName: string) => {
    navigate(`../forms/v2/submissions`, { state: { studentId, studentName } });
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass =
      selectedClass === "" || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "256px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "448px",
            margin: "32px auto 0",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ fontWeight: "500", margin: "0 0 12px 0" }}>{error}</p>
          <button
            onClick={fetchStudents}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#b91c1c";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        //background: "linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <GraduationCap
              style={{ height: "32px", width: "32px", color: "#2563eb" }}
            />
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#111827",
                margin: 0,
              }}
            >
              Students
            </h1>
          </div>
          <PermissionGate permission="student.create">
            <button
              onClick={handleAddStudent}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
              }}
            >
              <Plus style={{ height: "20px", width: "20px" }} />
              <span>Add Student</span>
            </button>
          </PermissionGate>
        </div>

        {/* Search and Filter */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1", maxWidth: "384px" }}>
            <Search
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                height: "20px",
                width: "20px",
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
            />
          </div>

          <div style={{ position: "relative", minWidth: "200px" }}>
            <Filter
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                height: "20px",
                width: "20px",
                color: "#9ca3af",
              }}
            />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "40px",
                paddingTop: "12px",
                paddingBottom: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                appearance: "none",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
            >
              <option value="">All Classes</option>
              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.classNumber}
                </option>
              ))}
            </select>
            <svg
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                height: "16px",
                width: "16px",
                color: "#6b7280",
                pointerEvents: "none",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Students Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredStudents.map((student) => (
            <div
              key={student._id}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 6px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Student Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "18px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {student.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4b5563",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Age {student.age || 0}
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 8px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                    }}
                  >
                    Active
                  </div>
                </div>
                <PermissionGate permission="student.edit">
                  <button
                    onClick={() => handleEditStudent(student._id)}
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "8px",
                      color: "#9ca3af",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                      e.currentTarget.style.color = "#4b5563";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#9ca3af";
                    }}
                    title="Edit Student"
                  >
                    <Edit style={{ height: "16px", width: "16px" }} />
                  </button>
                </PermissionGate>
                
                {/* <button
                  onClick={() => handleFillForm(student._id, student.name)}
                  style={{
                    padding: "8px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    color: "#9ca3af",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f9ff";
                    e.currentTarget.style.color = "#2563eb";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                  title="Fill Form"
                >
                  <FileText style={{ height: "16px", width: "16px" }} />
                </button>
                
                <button
                  onClick={() => handleViewSubmissions(student._id, student.name)}
                  style={{
                    padding: "8px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    color: "#9ca3af",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                    e.currentTarget.style.color = "#16a34a";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                  title="View Past Forms"
                >
                  <History style={{ height: "16px", width: "16px" }} />
                </button> */}

                {/* V2 Form Buttons */}
                <button
                  onClick={() => handleFillFormV2(student._id, student.name)}
                  style={{
                    padding: "8px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    color: "#9ca3af",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f3ff";
                    e.currentTarget.style.color = "#6366f1";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                  title="Fill Form V2 (Enhanced)"
                >
                  <FileText style={{ height: "16px", width: "16px", strokeWidth: 2.5 }} />
                </button>
                
                <button
                  onClick={() => handleViewSubmissionsV2(student._id, student.name)}
                  style={{
                    padding: "8px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    color: "#9ca3af",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0fdfa";
                    e.currentTarget.style.color = "#14b8a6";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                  title="View Submissions V2 (Enhanced)"
                >
                  <History style={{ height: "16px", width: "16px", strokeWidth: 2.5 }} />
                </button>
              </div>

              {/* Student Info */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>Date of Birth:</span>{" "}
                  {new Date(student.DOB).toLocaleDateString()}
                </div>
                {student.classId && (
                  <div style={{ fontSize: "14px", color: "#4b5563" }}>
                    <span style={{ fontWeight: "500" }}>Class:</span>{" "}
                    {getClassNameById(student.classId)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleViewDetails(student._id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#1d4ed8";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                >
                  <Eye style={{ height: "16px", width: "16px" }} />
                  <span>View Details</span>
                </button>
                <PermissionGate permission="student.delete">
                  <button
                    onClick={() => handleDeleteStudent(student._id)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #fca5a5",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      color: "#dc2626",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#fef2f2";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    title="Delete Student"
                  >
                    <Trash2 style={{ height: "16px", width: "16px" }} />
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <GraduationCap
              style={{
                height: "64px",
                width: "64px",
                color: "#9ca3af",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                color: "#6b7280",
                fontSize: "20px",
                marginBottom: "8px",
              }}
            >
              No students found
            </div>
            <p style={{ color: "#9ca3af", margin: 0 }}>
              Try adjusting your search criteria or add a new student
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
