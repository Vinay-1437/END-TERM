import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Megaphone, ArrowLeft, Calendar, User } from "lucide-react";
import { announcementAPI } from "../../services/api.js";
import MainLayout from "../../layouts/MainLayout.jsx";
import { PageLoader, ErrorMessage, Card } from "../../components/UI.jsx";
import { formatDateTime, getErrorMessage } from "../../utils/helpers.js";

const AnnouncementDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await announcementAPI.getById(id);
        setItem(res.data.announcement);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <MainLayout>
      <Link to="/announcements" className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Announcements
      </Link>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <Card className="p-8 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-orange-500" />
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium capitalize">
              {item.category}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h1>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {item.author?.name} ({item.author?.role})
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDateTime(item.createdAt)}
            </span>
            {item.expiresAt && (
              <span>Expires: {formatDateTime(item.expiresAt)}</span>
            )}
          </div>
        </Card>
      )}
    </MainLayout>
  );
};

export default AnnouncementDetail;
