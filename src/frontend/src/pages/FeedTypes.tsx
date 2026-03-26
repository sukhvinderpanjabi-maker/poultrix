import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { type FeedType, storage } from "@/lib/storage";
import { Pencil, Plus, Trash2, Wheat } from "lucide-react";
import { useState } from "react";

export default function FeedTypes() {
  const { currentUser } = useAuth();
  const canEdit =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";

  const [types, setTypes] = useState<FeedType[]>(() => storage.getFeedTypes());
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<FeedType | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => setTypes(storage.getFeedTypes());

  const openNew = () => {
    setEditItem(null);
    setForm({ name: "", description: "" });
    setDialog(true);
  };

  const openEdit = (ft: FeedType) => {
    setEditItem(ft);
    setForm({ name: ft.name, description: ft.description });
    setDialog(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editItem) {
      storage.updateFeedType(editItem.id, {
        name: form.name.trim(),
        description: form.description.trim(),
      });
    } else {
      storage.addFeedType({
        name: form.name.trim(),
        description: form.description.trim(),
        companyId: currentUser?.companyId,
      });
    }
    refresh();
    setDialog(false);
  };

  const confirmDelete = (id: string) => setDeleteId(id);
  const doDelete = () => {
    if (deleteId) {
      storage.deleteFeedType(deleteId);
      refresh();
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6" data-ocid="feed_types.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feed Types</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage feed type definitions used across the system.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNew} data-ocid="feed_types.open_modal_button">
            <Plus size={16} className="mr-1" /> Add Feed Type
          </Button>
        )}
      </div>

      {types.length === 0 ? (
        <Card data-ocid="feed_types.empty_state">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Wheat size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No feed types defined.</p>
            <p className="text-sm mt-1">
              Add your first feed type to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-ocid="feed_types.table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Description</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {types.map((ft, i) => (
                <tr
                  key={ft.id}
                  className="border-b hover:bg-muted/30"
                  data-ocid={`feed_types.row.${i + 1}`}
                >
                  <td className="p-3 font-medium">
                    <Badge variant="outline">{ft.name}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {ft.description || "—"}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(ft)}
                          data-ocid={`feed_types.edit_button.${i + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDelete(ft.id)}
                          data-ocid={`feed_types.delete_button.${i + 1}`}
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
        <DialogContent data-ocid="feed_types.dialog">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Feed Type" : "Add Feed Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                data-ocid="feed_types.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Pre-Starter"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                data-ocid="feed_types.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of this feed type"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(false)}
              data-ocid="feed_types.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={save} data-ocid="feed_types.save_button">
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
        <DialogContent data-ocid="feed_types.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete Feed Type?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This feed type will be removed. Existing records referencing it will
            retain the name.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="feed_types.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doDelete}
              data-ocid="feed_types.delete_confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
