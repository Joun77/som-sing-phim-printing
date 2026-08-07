Created At: 2026-08-06T17:10:44Z
Completed At: 2026-08-06T17:10:44Z
File Path: `file:///Users/joun/Documents/%E0%BA%AA%E0%BA%BB%E0%BA%A1%E0%BA%AA%E0%BA%B4%E0%BB%88%E0%BA%87%E0%BA%9E%E0%BA%B4%E0%BA%A1/src/components/customers/CustomerManagement.jsx`
Total Lines: 1024
Total Bytes: 52968
Showing lines 750 to 790
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
750:                                   </button>
751:                                 ) : (
752:                                   <span className="text-xs text-slate-300 italic block pl-1">ບໍ່ມີສລິບ</span>
753:                                 )}
754:                               </td>
755:                               {/* Price charged */}
756:                               <td className="py-4.5 px-4 sm:py-6 sm:px-6 text-right font-sans font-black text-slate-900">
757:                                 <span className="block text-base lg:text-lg">{formatLAK(o.totalPriceCharged)}</span>
758:                                 {o.remainingUnpaidBalance > 0 && (
759:                                   <span className="text-xs font-sans font-bold text-red-500 block mt-1.5">
760:                                     ຄ້າງ: {formatLAK(o.remainingUnpaidBalance)}
761:                                   </span>
762:                                 )}
763:                               </td>
764:                               {/* View Invoice Receipt */}
765:                               <td className="py-6 px-6 text-center">
766:                                 <button
767:                                   onClick={() => setReceiptOrder(o)}
768:                                   className="p-3 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 text-slate-400 rounded-xl transition border border-slate-100 shadow-sm"
769:                                   title="ເບິ່ງໃບບິນ"
770:                                 >
771:                                   <Receipt className="w-5 h-5" />
772:                                 </button>
773:                               </td>
774:                             </tr>
775:                           );
776:                         })}
777:                       </tbody>
778:                     </table>
779:                   </div>
780:                 )}
781:               </div>
782:             </div>
783:           </div>
784:         </div>
785:       )}
786:       {/* 👤 REGISTER NEW CUSTOMER MODAL */}
787:       {isAddModalOpen && (
788:         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
789:           <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
790:             <div className="flex justify-between items-center border-b pb-4">
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
