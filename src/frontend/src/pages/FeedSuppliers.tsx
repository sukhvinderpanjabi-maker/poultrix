import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { type FeedSupplier, storage } from "@/lib/storage";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useState } from "react";

export default function FeedSuppliers() {
  const { currentUser } = useAuth();
  const canEdit =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";

  const [suppliers, setSuppliers] = useState<FeedSupplier[]>(() =>
    storage.getFeedSuppliers(),
  );
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<FeedSupplier | null>(null);
  const [form, setForm] = useState({ name: "", contactName: "", phone: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => setSuppliers(storage.getFeedSuppliers());

  const openNew = () => {
    setEditItem(null);
    setForm({ name: "", contactName: "", phone: "" });
    setDialog(true);
  };

  const openEdit = (s: FeedSupplier) => {
    setEditItem(s);
    setForm({ name: s.name, contactName: s.contactName, phone: s.phone });
    setDialog(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editItem) {
      storage.updateFeedSupplier(editItem.id, {
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
      });
    } else {
      storage.addFeedSupplier({
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        companyId: currentUser?.companyId,
      });
    }
    refresh();
    setDialog(false);
  };

  return (
    <div className="space-y-6" data-ocid="feed_suppliers.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feed Suppliers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your feed mills and supplier master list.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={openNew}
            data-ocid="feed_suppliers.open_modal_button"
          >
            <Plus size={16} className="mr-1" /> Add Supplier
          </Button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <Card data-ocid="feed_suppliers.empty_state">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Truck size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No suppliers added yet.</p>
            <p className="text-sm mt-1">
              Add your feed mills and suppliers to use in purchase entries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="feed_suppliers.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">Supplier / Feed Mill</th>
                <th className="text-left p-3">Contact Person</th>
                <th className="text-left p-3">Phone</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`feed_suppliers.row.${i + 1}`}
                >
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.contactName || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.phone || "—"}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(s)}
                          data-ocid={`feed_suppliers.edit_button.${i + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(s.id)}
                          data-ocid={`feed_suppliers.delete_button.${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent data-ocid="feed_suppliers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier / Feed Mill Name *</Label>
              <Input
                data-ocid="feed_suppliers.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Godrej Agrovet"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                data-ocid="feed_suppliers.contact.input"
                value={form.contactName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactName: e.target.value }))
                }
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                data-ocid="feed_suppliers.phone.input"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+91 ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              data-ocid="feed_suppliers.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={save} data-ocid="feed_suppliers.save_button">
              {editItem ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent data-ocid="feed_suppliers.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete Supplier?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This supplier will be removed from the master list.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="feed_suppliers.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  storage.deleteFeedSupplier(deleteId);
                  refresh();
                  setDeleteId(null);
                }
              }}
              data-ocid="feed_suppliers.delete_confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
