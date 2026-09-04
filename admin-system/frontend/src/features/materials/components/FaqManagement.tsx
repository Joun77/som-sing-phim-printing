import React, { useState } from 'react';
import { Plus, Edit3, Trash2, HelpCircle, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { ProductFAQ, CreateFAQInput } from '../types';
import {
  useFAQs,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  useReorderFAQs,
} from '../api/materialsApi';

export const FaqManagement: React.FC = () => {
  const { data: faqs = [], isLoading, isError } = useFAQs();
  const createMutation = useCreateFAQ();
  const updateMutation = useUpdateFAQ();
  const deleteMutation = useDeleteFAQ();
  const reorderMutation = useReorderFAQs();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [questionLo, setQuestionLo] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [answerLo, setAnswerLo] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setQuestionLo('');
    setQuestionEn('');
    setAnswerLo('');
    setAnswerEn('');
    setSortOrder(10);
    setIsAdding(false);
    setEditingId(null);
    setFormError('');
  };

  const startEdit = (faq: ProductFAQ) => {
    setEditingId(faq.id);
    setQuestionLo(faq.questionLo || '');
    setQuestionEn(faq.questionEn || '');
    setAnswerLo(faq.answerLo || '');
    setAnswerEn(faq.answerEn || '');
    setSortOrder(faq.sortOrder ?? 10);
    setIsAdding(false);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!questionLo.trim() || !answerLo.trim()) {
      setFormError('ກະລຸນາໃສ່ຄຳຖາມ ແລະ ຄຳຕອບ (ພາສາລາວ)');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          input: {
            id: editingId,
            questionLo: questionLo.trim(),
            questionEn: questionEn.trim(),
            answerLo: answerLo.trim(),
            answerEn: answerEn.trim(),
            sortOrder: Number(sortOrder) || 0,
            isActive: true,
          },
        });
      } else {
        const payload: CreateFAQInput = {
          questionLo: questionLo.trim(),
          questionEn: questionEn.trim(),
          answerLo: answerLo.trim(),
          answerEn: answerEn.trim(),
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
        };
        await createMutation.mutateAsync(payload);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ FAQ ນີ້?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newItems = [...faqs];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((item, idx) => ({
      id: item.id,
      sortOrder: (idx + 1) * 10,
    }));

    await reorderMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        ບໍ່ສາມາດດຶງຂໍ້ມູນ FAQ ໄດ້ ກະລຸນາກວດສອບການເຊື່ອມຕໍ່ Backend
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            ຄຳຖາມທີ່ພົບເລື້ອຍກ່ຽວກັບວັດສະດຸ & ງານພິມ (Material FAQs)
          </h3>
          <p className="text-xs text-slate-500">
            ຄຳຖາມ-ຕອບທີ່ຈະສະແດງໃນແຖບ FAQ ຂອງໜ້າແນະນຳວັດສະດຸ (Print Guide) ຝັ່ງ Storefront
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            ເພີ່ມ FAQ ໃໝ່
          </button>
        )}
      </div>

      {/* Form (Add or Edit) */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-blue-700">
              {editingId ? 'ແກ້ໄຂ FAQ' : 'ເພີ່ມ FAQ ໃໝ່'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ຄຳຖາມ (ພາສາລາວ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={questionLo}
                onChange={(e) => setQuestionLo(e.target.value)}
                placeholder="ຄວນເລືອກເຈ້ຍອາດເງົາ ຫຼື ອາດດ້ານ?"
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Question (English)
              </label>
              <input
                type="text"
                value={questionEn}
                onChange={(e) => setQuestionEn(e.target.value)}
                placeholder="Should I choose Glossy or Matte Art paper?"
                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ຄຳຕອບ (ພາສາລາວ) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={answerLo}
                onChange={(e) => setAnswerLo(e.target.value)}
                placeholder="ຫາກຕ້ອງການສີສັນສົດໃສ ເນັ້ນຮູບພາບແນະນຳອາດເງົາ..."
                className="w-full text-sm border-slate-200 rounded-lg p-2.5 border outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Answer (English)
              </label>
              <textarea
                rows={3}
                value={answerEn}
                onChange={(e) => setAnswerEn(e.target.value)}
                placeholder="If you want vibrant photo reproduction, choose Glossy..."
                className="w-full text-sm border-slate-200 rounded-lg p-2.5 border outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">ລຳດັບ (Sort Order):</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {editingId ? 'ບັນທຶກ' : 'ເພີ່ມ FAQ'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            ຍັງບໍ່ມີ FAQ ໃນລະບົບ
          </div>
        ) : (
          faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="p-4 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all flex items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  Q{index + 1}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{faq.questionLo}</h4>
                  {faq.questionEn && (
                    <p className="text-xs text-slate-500 italic">{faq.questionEn}</p>
                  )}
                  <p className="text-xs text-slate-600 whitespace-pre-wrap pt-1">{faq.answerLo}</p>
                  {faq.answerEn && (
                    <p className="text-xs text-slate-400 whitespace-pre-wrap italic">{faq.answerEn}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="ຍ້າຍຂຶ້ນ"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === faqs.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-100"
                  title="ຍ້າຍລົງ"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(faq)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="ແກ້ໄຂ"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(faq.id)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                  title="ລຶບ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
