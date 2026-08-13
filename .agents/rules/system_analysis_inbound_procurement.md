---
trigger: manual
---

# ບົດລາຍງານການວິເຄາະ ແລະ ແກ້ໄຂ UI/UX ໜ້ານຳເຂົ້າສິນຄ້າ (Inbound Procurement)
**ໂຄງການ:** Som Sing Printing Admin System  
**ວັນທີວິເຄາະ:** 14 ສິງຫາ 2026  
**ສະຖານະ:** ຖໍ້າການປະເມິນ ແລະ ສະຫຼຸບແນວທາງການແກ້ໄຂ (UI/UX Analysis & Issue Summary)

---

## 1. ພາບຮວມບັນຫາທີ່ກວດພົບ (Executive Summary)

ຈາກການກວດສອບອິນເຕີເຟດ (UI) ໃນໜ້າ **ນຳເຂົ້າສິນຄ້າ & ອຸປະກອນ (Inbound Procurement)** ພົບບັນຫາຫຼັກ 3 ປະການ ທີ່ສົ່ງຜົນກະທົບຕໍ່ຄວາມງາມ, ຄວາມເປັນມືອາຊີບ ແລະ ປະສົບການຜູ້ໃຊ້ (UX):

1. **Duplicate Action Icons (+ +):** ເຄື່ອງໝາຍບວກຊ້ຳກັນ 2 ຕົວຢູ່ປຸ໋ມກົດນຳເຂົ້າສິນຄ້າ.
2. **Nested Modal Header & Double Close Buttons (X X):** ຟອມ Pop-up ມິປຸ໋ມປິດ (`X`) ຊ້ຳກັນ 2 ອັນ ແລະ ມີຊື່ Header ຊ້ຳກັນ 2 ຊັ້ນ.
3. **Localization / Language Mixing:** ຍັງມີການໃຊ້ພາສາໄທປົນຢູ່ໃນຟອມ ແລະ ຕາຕະລາງ ສວນທີ່ຄວນເປັນພາສາລາວ.

---

## 2. ວິເຄາະບັນຫາ ແລະ ແນວທາງການແກ້ໄຂແບບລະອຽດ

### 2.1. ປຸ໋ມນຳເຂົ້າສິນຄ້າມີເຄື່ອງໝາຍ `+ +` ຊ້ຳກັນ (Button Icon Duplication)
* **ຮູບແບບບັນຫາ:** ຢູ່ປຸ໋ມປະທານ (Primary Button) ດ້ານຂວາເທິງຂອງໜ້າຈໍ ສະແດງຜົນເປັນ `+ + ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່`.
* **ສາເຫດທາງເຕັກນິກ:** ເກີດຈາກການຮາດໂຄ້ດໄອຄອນ `<Icon />` ເຂົ້າໄປໃນ Element ຂອງ Label ບວກກັບການກຳນົດ Attribute `leftIcon` ຂອງ Button Component ໃນ Design System ຊ້ຳກັນ.
* **ແນວທາງແກ້ໄຂ (Action Item):**
  * ເລືອກໃຊ້ໄອຄອນຈາກ Component ພຽງທາງດຽວ ເຊັ່ນ: `leftIcon={<PlusIcon />}`.
  * ລົບ Text/SVG ໄອຄອນບວກອັນເກີນອອກໃຫ້ເຫຼືອພຽງໄອຄອນດຽວ.

---

### 2.2. ຟອມ Modal ມີປຸ໋ມປິດ `X X` 2 ອັນ ແລະ Header ຊ້ຳກັນ (Duplicate Controls & Title)
* **ຮູບແບບບັນຫາ:**
  1. ຢູ່ກົກຂວາເທິງຂອງ Modal ປະກົດມີປຸ໋ມ `X` 2 ອັນຢູ່ໃກ້ກັນ.
  2. ມີ Title ສະແດງ 2 ແຖວຊ້ອນກັນ:
     * ແຖວເທິງ: `ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (New Inbound Procurement)`
     * ແຖວລຸ່ມ: `ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (Dynamic Inbound Form)`
* **ສາເຫດທາງເຕັກນິກ:** ເກີດຈາກການຊ້ອນ Modal (Nested Structure) ໂດຍ Wrapper Modal ມີ Header/Close Button ຢູ່ແລ້ວ ແຕ່ພາຍໃນ Body ພັດມີການເອົາ Inner Header Component ມາໃສ່ຊ້ຳອີກ.
* **ແນວທາງແກ້ໄຂ (Action Item):**
  * **ປຸ໋ມປິດ (`X`):** ລົບປຸ໋ມ `X` ຂອງ Inner Header ອອກ ໃຫ້ເຫຼືອພຽງປຸ໋ມປິດຂອງ Outer Modal Container ອັນດຽວ.
  * **ຊື່ຟອມ (Header Title):** ລວມ Title ໃຫ້ເຫຼືອອັນດຽວຢູ່ເທິງສຸດ ເຊັ່ນ: `ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (Dynamic Inbound Form)`.

---

### 2.3. ການປັບປຸງພາສາ (Localization / Translation to Lao)
* **ຮູບແບບບັນຫາ:** ຂໍ້ຄວາມບາງສ່ວນໃນ Tab ເລືອກປະເພດ ແລະ ຕາຕະລາງຍັງເປັນພາສາໄທ.
* **ແນວທາງແກ້ໄຂ (Action Item):** ປັບປຸງ Dictionary/i18n Key ໃຫ້ເປັນພາສາລາວທັງໝົດ ດັ່ງຕາຕະລາງລຸ່ມນີ້:

| ຂໍ້ຄວາມພາສາໄທ (ປັດຈຸບັນ) | ຄຳແປພາສາລາວ (ແນະນຳ) | ສະຖານທີ່ສະແດງຜົນ (Location) |
| :--- | :--- | :--- |
| **หมึกพิมพ์** | ໝຶກພິມ | Dynamic Form Category Tab |
| **กระดาษ** | ເຈ້ຍ | Dynamic Form Category Tab |
| **ฟิล์มเคลือบ** | ຟີມເຄືອບ | Dynamic Form Category Tab |
| **เครื่องจักร** | ເຄື່ອງຈັກ | Dynamic Form Category Tab |
| **เข้าเล่ม** | ເຂົ້າເລົ່ມ | Dynamic Form Category Tab |
| **อะไหล่** | ອະໄຫຼ່ / ອາໄຫຼ່ | Dynamic Form Category Tab |
| **รายการ/ชิ้น** | ລາຍການ / ຊິ້ນ | Summary Card (ຈຳນວນນຳເຂົ້າ) |
| **แผ่นสีและ** | ແຜ່ນສີ ແລະ | Form Label (Color Slots) |
| **ลวดเย็บแม็ก** | ລວດເຢັບແມັກ | Table Data Column |

---

## 3. ລາຍການກວດສອບສຳລັບທີມພັດທະນາ (Developer Checklist)

- [ ] **[ ] Button Fix:** ລົບ Icon `+` ທີ່ຊ້ຳກັນໃນປຸ໋ມ `+ ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່`
- [ ] **[ ] Modal Structure:** ລົບ Inner Close Button (`X`) ອອກໃຫ້ເຫຼືອ Close Button ຫຼັກອັນດຽວ
- [ ] **[ ] Modal Header:** ລວມ Header Title ໃຫ້ເຫຼືອ 1 ຊັ້ນ ແລະ ປັບປຸງ Label ໃຫ້ຈະແຈ້ງ
- [ ] **[ ] Translation:** ອັບເດດພາສາໄທທັງໝົດໃນໜ້າ Inbound Procurement ໃຫ້ເປັນພາສາລາວ
- [ ] **[ ] QA Verification:** ກວດສອບຄວາມຮຽບຮ້ອຍໃນ Mobile/Desktop Viewport

---
*ບົດລາຍງານນີ້ຈັດເຮັດຂຶ້ນເພື່ອເປັນເອກະສານອ້າງອີງໃນການແກ້ໄຂບັກ (Bug Fixing) ແລະ ປັບປຸງ UI/UX ຂອງລະບົບ.*
