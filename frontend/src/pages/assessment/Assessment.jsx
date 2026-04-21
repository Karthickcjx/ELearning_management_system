import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Award, ThumbsUp, Frown, Loader2 } from 'lucide-react';
import { Modal } from 'antd';
import { assessmentService } from '../../api/assessment.service';
import Navbar from '../../components/common/Navbar';

function Assessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = location.pathname.split("/")[2];
  const [test, setTest] = useState([]);
  const [userId] = useState(localStorage.getItem("id"));
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [correctCount, setCorrectCount] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [totalQsns, setTotalQsns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const result = await assessmentService.getQuestions(courseId);
      if (result.success) {
        setTest(result.data);
        setTotalQsns(result.data.length);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [courseId]);

  const handleAnswerChange = (questionId, selectedOption) => {
    const question = test.find(q => q.id === questionId);
    const prevAnswer = selectedAnswers[questionId];
    const updatedSelectedAnswers = { ...selectedAnswers };
    let scoreChange = 0;

    if (prevAnswer === selectedOption) {
      delete updatedSelectedAnswers[questionId];
      if (question.answer === selectedOption) scoreChange = -1;
    } else {
      updatedSelectedAnswers[questionId] = selectedOption;
      if (prevAnswer && question.answer === prevAnswer) scoreChange -= 1;
      if (question.answer === selectedOption) scoreChange += 1;
    }

    setSelectedAnswers(updatedSelectedAnswers);
    setCorrectCount(prev => prev + scoreChange);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const marks = totalQsns > 0 ? (correctCount / totalQsns) * 100 : 0;
    const result = await assessmentService.submitAssessment(userId, courseId, marks);
    setSubmitting(false);
    if (result.success) setOpenModal(true);
    else alert("Failed to submit assessment. Please try again.");
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCorrectCount(0);
  };

  const getResultMessage = () => {
    const percentage = totalQsns > 0 ? (correctCount / totalQsns) * 100 : 0;
    if (percentage >= 80) return { message: 'Excellent!', Icon: Award, color: 'text-amber-500' };
    if (percentage >= 60) return { message: 'Good Job!', Icon: ThumbsUp, color: 'text-emerald-500' };
    return { message: 'Keep Learning!', Icon: Frown, color: 'text-orange-500' };
  };

  const resultData = getResultMessage();
  const ResultIcon = resultData.Icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar page="learnings" />
        <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center py-16">
            <Loader2 size={32} className="text-primary animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar page="learnings" />
      <div className="max-w-container-xl mx-auto px-6 py-6 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-md px-3 py-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Course
          </button>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Assessment Questions
          </h1>

          <div className="bg-white border border-slate-200 rounded-md px-4 py-2">
            <p className="text-xs text-slate-500 font-medium">Progress</p>
            <p className="text-base font-bold text-primary">
              {Object.keys(selectedAnswers).length}/{totalQsns}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {test.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Question {index + 1}: {question.question}
                </h3>
              </div>

              <div className="p-6 space-y-2">
                {[question.option1, question.option2, question.option3, question.option4].map((option, optionIndex) => {
                  const isSelected = selectedAnswers[question.id] === option;
                  return (
                    <label
                      key={`${question.id}-${optionIndex}`}
                      className={`flex items-center p-3 rounded-md cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-primary text-slate-900'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={handleReset}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md px-4 py-2 transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selectedAnswers).length !== totalQsns}
            className={`inline-flex items-center gap-2 font-semibold rounded-md px-4 py-2 transition-colors ${
              submitting || Object.keys(selectedAnswers).length !== totalQsns
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </button>
        </div>
      </div>

      <Modal
        open={openModal}
        onOk={() => setOpenModal(false)}
        onCancel={() => setOpenModal(false)}
        footer={[
          <button
            key="ok"
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-primary text-white font-semibold rounded-md px-4 py-2 hover:bg-primary-dark transition-colors"
          >
            Continue Learning
          </button>
        ]}
        width={500}
      >
        <div className="text-center py-4">
          <div className={`mb-3 inline-flex ${resultData.color}`}>
            <ResultIcon size={56} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Assessment Complete</h2>
          <h3 className={`text-lg font-semibold mb-4 ${resultData.color}`}>{resultData.message}</h3>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-5 mb-4">
            <div className="text-3xl font-bold text-primary mb-1">
              {totalQsns > 0 ? Math.round((correctCount / totalQsns) * 100) : 0}%
            </div>
            <p className="text-sm text-slate-600">
              You answered <span className="font-semibold text-slate-900">{correctCount}</span> out of{' '}
              <span className="font-semibold text-slate-900">{totalQsns}</span> questions correctly
            </p>
          </div>

          <div className="flex justify-center gap-4 text-sm text-slate-600">
            <div className="inline-flex items-center gap-1">
              <Check size={14} className="text-emerald-500" />
              Correct: {correctCount}
            </div>
            <div className="inline-flex items-center gap-1">
              <X size={14} className="text-red-500" />
              Incorrect: {totalQsns - correctCount}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Assessment;
