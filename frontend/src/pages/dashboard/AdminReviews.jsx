import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Space, Table, message } from "antd";
import { Search, Star, Trash2 } from "lucide-react";
import { adminService } from "../../api/admin.service";
import StarRating from "../../components/reviews/StarRating";

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadReviews = async ({ current = pagination.current, pageSize = pagination.pageSize } = {}) => {
    setLoading(true);
    const response = await adminService.getReviews({
      search,
      rating: ratingFilter,
      page: current - 1,
      size: pageSize,
    });
    setLoading(false);

    if (response.success) {
      const data = response.data || {};
      setReviews(data.content || []);
      setPagination({
        current: (data.number || 0) + 1,
        pageSize: data.size || pageSize,
        total: data.totalElements || 0,
      });
    } else {
      message.error(response.error || "Unable to fetch reviews");
    }
  };

  useEffect(() => {
    loadReviews({ current: 1, pageSize: pagination.pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  const analytics = useMemo(() => {
    const count = reviews.length;
    const average = count
      ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / count
      : 0;
    const fiveStar = reviews.filter((review) => Number(review.rating) === 5).length;

    return {
      visible: count,
      average: average.toFixed(1),
      fiveStar,
    };
  }, [reviews]);

  const confirmDelete = (review) => {
    Modal.confirm({
      title: "Delete review",
      content: `Delete ${review.userName || "this learner"}'s review for ${review.courseName || "this course"}?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        const response = await adminService.deleteReview(review.id);
        if (response.success) {
          message.success("Review deleted");
          loadReviews();
        } else {
          message.error(response.error || "Unable to delete review");
        }
      },
    });
  };

  const columns = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      render: (value) => <span className="font-semibold text-slate-800">{value || "Learner"}</span>,
    },
    {
      title: "Course",
      dataIndex: "courseName",
      key: "courseName",
      render: (value) => <span className="text-slate-700">{value || "Course"}</span>,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 150,
      render: (value) => (
        <div className="flex items-center gap-2">
          <StarRating value={value} readOnly size={15} />
          <strong className="text-slate-800">{value}</strong>
        </div>
      ),
    },
    {
      title: "Review",
      dataIndex: "reviewText",
      key: "reviewText",
      render: (value) => (
        <span className="text-slate-600">
          {value ? (value.length > 120 ? `${value.slice(0, 117)}...` : value) : "No written feedback"}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (_, record) => formatDate(record.updatedAt || record.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Button danger size="small" icon={<Trash2 size={14} />} onClick={() => confirmDelete(record)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="admin-page-header">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Review Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Moderate learner reviews and monitor rating quality.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 m-0">{pagination.total}</p>
            <p className="text-sm text-slate-500 m-0">Total reviews</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 m-0">{analytics.average}</p>
            <p className="text-sm text-slate-500 m-0">Visible avg rating</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 m-0">{analytics.fiveStar}</p>
            <p className="text-sm text-slate-500 m-0">Five-star on page</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            allowClear
            prefix={<Search size={15} className="text-slate-400" />}
            placeholder="Search by user, email, or course"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onPressEnter={() => loadReviews({ current: 1 })}
          />
          <Select
            value={ratingFilter}
            onChange={setRatingFilter}
            className="md:w-44"
            options={[
              { value: "", label: "All ratings" },
              { value: 5, label: "5 stars" },
              { value: 4, label: "4 stars" },
              { value: 3, label: "3 stars" },
              { value: 2, label: "2 stars" },
              { value: 1, label: "1 star" },
            ]}
          />
          <Space>
            <Button type="primary" onClick={() => loadReviews({ current: 1 })}>
              Search
            </Button>
            <Button
              onClick={() => {
                setSearch("");
                setRatingFilter("");
              }}
            >
              Reset
            </Button>
          </Space>
        </div>
      </div>

      <div className="admin-antd-table-wrap">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reviews}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} reviews`,
          }}
          onChange={(nextPagination) =>
            loadReviews({
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            })
          }
          scroll={{ x: 1000 }}
        />
      </div>
    </>
  );
}

export default AdminReviews;
