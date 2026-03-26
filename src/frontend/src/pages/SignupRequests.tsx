import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";
import type { SignupRequest } from "@/lib/storage";
import { CheckCircle, Clock, UserPlus, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Tab = "all" | "pending" | "approved" | "rejected";

export default function SignupRequests() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [tab, setTab] = useState<Tab>("pending");

  const load = useCallback(() => setRequests(storage.getSignupRequests()), []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = requests.filter((r) => tab === "all" || r.status === tab);

  const handleApprove = (req: SignupRequest) => {
    const userId = storage.generateUserId(req.role);
    storage.addUser({
      username: userId.toLowerCase(),
      password: req.password,
      name: req.fullName,
      role: req.role === "Company" ? "CompanyAdmin" : req.role,
      email: req.email,
      mobileNumber: req.mobileNumber,
      active: true,
      signupStatus: "approved",
    });
    storage.updateSignupRequest(req.id, { status: "approved", userId });
    toast.success(`User approved. User ID: ${userId}`);
    load();
  };

  const handleReject = (req: SignupRequest) => {
    storage.updateSignupRequest(req.id, { status: "rejected" });
    toast.error("Request rejected.");
    load();
  };

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const statusBadge = (status: SignupRequest["status"]) => {
    if (status === "pending")
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
          <Clock size={10} className="mr-1" />
          Pending
        </Badge>
      );
    if (status === "approved")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          <CheckCircle size={10} className="mr-1" />
          Approved
        </Badge>
      );
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
        <XCircle size={10} className="mr-1" />
        Rejected
      </Badge>
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" data-ocid="signup_requests.page">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
          <UserPlus size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Signup Requests</h1>
          <p className="text-sm text-gray-500">
            Review and approve new user registrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit"
        data-ocid="signup_requests.tab"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === key
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            data-ocid={`signup_requests.${key}.tab`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-gray-400"
          data-ocid="signup_requests.empty_state"
        >
          <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            No {tab !== "all" ? tab : ""} requests found
          </p>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          data-ocid="signup_requests.table"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-gray-200">
                <tr>
                  {[
                    "#",
                    "Name",
                    "Mobile",
                    "Email",
                    "Farm",
                    "Location",
                    "Role",
                    "Birds",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((req, idx) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 transition-colors"
                    data-ocid={`signup_requests.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {req.fullName}
                      {req.userId && (
                        <div className="text-xs text-green-600 font-mono">
                          {req.userId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {req.mobileNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                      {req.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {req.farmName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {req.city}, {req.state}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {req.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {req.birdCapacity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{statusBadge(req.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            data-ocid={`signup_requests.confirm_button.${idx + 1}`}
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req)}
                            className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                            data-ocid={`signup_requests.delete_button.${idx + 1}`}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
