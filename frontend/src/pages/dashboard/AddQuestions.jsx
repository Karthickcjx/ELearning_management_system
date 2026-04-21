import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Row,
  Col,
  Table,
  Modal,
  Popconfirm
} from 'antd';
import { HelpCircle, ArrowLeft, Plus, Edit2, Trash2, ListChecks } from 'lucide-react';
import { adminService } from '../../api/admin.service';
import { questionService } from '../../api/question.service';

const { TextArea } = Input;
const { Option } = Select;

function AddQuestion({ courseId, onBack }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const result = await questionService.getQuestionsByCourse(courseId);
      if (result.success) {
        setQuestions(result.data);
      } else {
        message.error(result.error || 'Failed to fetch questions');
      }
    } catch (error) {
      message.error('Failed to fetch questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const getActualAnswerValue = (values, selectedAnswer) => {
    const answerMap = {
      option1: values.option1,
      option2: values.option2,
      option3: values.option3,
      option4: values.option4,
    };
    return answerMap[selectedAnswer];
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const actualAnswerValue = getActualAnswerValue(values, values.answer);

      const questionData = {
        question: values.question,
        option1: values.option1,
        option2: values.option2,
        option3: values.option3,
        option4: values.option4,
        answer: actualAnswerValue,
        courseId: courseId,
      };

      const result = await adminService.createQuestion(questionData);

      if (result.success) {
        message.success('Question added successfully!');
        form.resetFields();
        setIsAddModalVisible(false);
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to add question');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);

    let selectedAnswer = 'option1';
    if (question.answer === question.option1) selectedAnswer = 'option1';
    else if (question.answer === question.option2) selectedAnswer = 'option2';
    else if (question.answer === question.option3) selectedAnswer = 'option3';
    else if (question.answer === question.option4) selectedAnswer = 'option4';

    editForm.setFieldsValue({
      question: question.question,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      answer: selectedAnswer,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!editingQuestion) return;

    try {
      const actualAnswerValue = getActualAnswerValue(values, values.answer);

      const questionData = {
        question: values.question,
        option1: values.option1,
        option2: values.option2,
        option3: values.option3,
        option4: values.option4,
        answer: actualAnswerValue,
        courseId: courseId,
      };

      const result = await adminService.updateQuestion(editingQuestion.id, questionData);

      if (result.success) {
        message.success('Question updated successfully!');
        setIsEditModalVisible(false);
        setEditingQuestion(null);
        editForm.resetFields();
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to update question');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    }
  };

  const handleDelete = async (questionId) => {
    try {
      const result = await adminService.deleteQuestion(questionId);
      if (result.success) {
        message.success('Question deleted successfully!');
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    }
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '85%',
      render: (text) => (
        <span className="text-sm text-slate-700 line-clamp-2" title={text}>{text}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => handleEdit(record)}
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <Popconfirm
            title="Delete Question"
            description="Are you sure you want to delete this question?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <button className="admin-btn admin-btn-danger" title="Delete">
              <Trash2 size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const QuestionForm = ({ form, onFinish, loading, submitText, initialValues, isAddMode }) => (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      size="middle"
      className="space-y-4"
      initialValues={initialValues}
    >
      <Form.Item
        label="Question"
        name="question"
        rules={[
          { required: true, message: 'Please enter the question' },
          { min: 10, message: 'Question must be at least 10 characters' },
          { max: 500, message: 'Question cannot exceed 500 characters' },
        ]}
      >
        <TextArea placeholder="Enter your question here..." rows={3} showCount maxLength={500} />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Option A"
            name="option1"
            rules={[
              { required: true, message: 'Option A is required' },
              { max: 200, message: 'Option cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="Enter option A" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Option B"
            name="option2"
            rules={[
              { required: true, message: 'Option B is required' },
              { max: 200, message: 'Option cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="Enter option B" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Option C"
            name="option3"
            rules={[
              { required: true, message: 'Option C is required' },
              { max: 200, message: 'Option cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="Enter option C" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Option D"
            name="option4"
            rules={[
              { required: true, message: 'Option D is required' },
              { max: 200, message: 'Option cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="Enter option D" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="Correct Answer"
        name="answer"
        rules={[{ required: true, message: 'Please select the correct answer' }]}
      >
        <Select placeholder="Select the correct answer">
          <Option value="option1">Option A</Option>
          <Option value="option2">Option B</Option>
          <Option value="option3">Option C</Option>
          <Option value="option4">Option D</Option>
        </Select>
      </Form.Item>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => {
            if (isAddMode) {
              setIsAddModalVisible(false);
              form.resetFields();
            } else {
              setIsEditModalVisible(false);
              setEditingQuestion(null);
              editForm.resetFields();
            }
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={loading}
        >
          <Plus size={14} />
          {submitText}
        </button>
      </div>
    </Form>
  );

  return (
    <>
      {/* Page header */}
      <div className="admin-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onBack}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <HelpCircle size={22} className="text-blue-600" />
                Question Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage questions for this course.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setIsAddModalVisible(true)}
          >
            <Plus size={14} />
            Add New Question
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800 m-0 flex items-center gap-2">
            <ListChecks size={18} className="text-emerald-600" />
            Existing Questions ({questions.length})
          </h2>
        </div>

        <div className="admin-antd-table-wrap">
          <Table
            columns={columns}
            dataSource={questions}
            rowKey="id"
            loading={loadingQuestions}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-blue-600" />
            <span>Add New Question</span>
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={720}
      >
        <QuestionForm
          form={form}
          onFinish={handleSubmit}
          loading={loading}
          submitText={loading ? 'Adding...' : 'Add Question'}
          isAddMode={true}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Edit2 size={16} className="text-blue-600" />
            <span>Edit Question</span>
          </div>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingQuestion(null);
          editForm.resetFields();
        }}
        footer={null}
        width={720}
      >
        <QuestionForm
          form={editForm}
          onFinish={handleEditSubmit}
          loading={false}
          submitText="Update Question"
          isAddMode={false}
        />
      </Modal>
    </>
  );
}

export default AddQuestion;
