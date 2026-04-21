import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, message } from 'antd';
import { X, User, Mail, Phone, MapPin, Briefcase, Github, Linkedin } from 'lucide-react';
import moment from 'moment';

const { Option } = Select;

const EditProfileModal = ({ visible, onCancel, userDetails, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userDetails) {
      form.setFieldsValue({
        username: userDetails.username,
        email: userDetails.email,
        mobileNumber: userDetails.mobileNumber,
        dob: userDetails.dob ? moment(userDetails.dob) : null,
        gender: userDetails.gender,
        location: userDetails.location,
        profession: userDetails.profession,
        linkedin_url: userDetails.linkedin_url,
        github_url: userDetails.github_url,
      });
    }
  }, [visible, userDetails, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
      };

      const success = await onUpdate(formattedValues);

      if (success) {
        message.success('Profile updated successfully!');
        onCancel();
      } else {
        message.error('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateURL = (_, value) => {
    if (!value) return Promise.resolve();
    try {
      new URL(value);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('Please enter a valid URL'));
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={640}
      destroyOnClose
      closable={false}
      centered
      className="eduverse-edit-modal"
      styles={{
        content: { borderRadius: 12, padding: 24 },
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={18} />
        </button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter your username!' },
              { min: 3, message: 'Username must be at least 3 characters!' },
            ]}
          >
            <Input
              prefix={<User size={14} className="text-slate-400" />}
              placeholder="Enter your username"
              size="large"
            />
          </Form.Item>

          <Form.Item name="email" label="Email Address">
            <Input
              prefix={<Mail size={14} className="text-slate-400" />}
              placeholder="Email cannot be changed"
              size="large"
              disabled
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            name="mobileNumber"
            label="Phone Number"
            rules={[{ pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number!' }]}
          >
            <Input
              prefix={<Phone size={14} className="text-slate-400" />}
              placeholder="Enter your phone number"
              size="large"
            />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker
              placeholder="Select date of birth"
              size="large"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current > moment().endOf('day')}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select your gender" size="large" allowClear>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="location" label="Location">
            <Input
              prefix={<MapPin size={14} className="text-slate-400" />}
              placeholder="Enter your location"
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item name="profession" label="Profession">
          <Input
            prefix={<Briefcase size={14} className="text-slate-400" />}
            placeholder="Enter your profession"
            size="large"
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item name="linkedin_url" label="LinkedIn URL" rules={[{ validator: validateURL }]}>
            <Input
              prefix={<Linkedin size={14} className="text-slate-400" />}
              placeholder="https://linkedin.com/in/username"
              size="large"
            />
          </Form.Item>

          <Form.Item name="github_url" label="GitHub URL" rules={[{ validator: validateURL }]}>
            <Input
              prefix={<Github size={14} className="text-slate-400" />}
              placeholder="https://github.com/username"
              size="large"
            />
          </Form.Item>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button onClick={onCancel} size="large" className="sm:min-w-[100px]">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="sm:min-w-[140px] w-full sm:w-auto"
          >
            Update Profile
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
