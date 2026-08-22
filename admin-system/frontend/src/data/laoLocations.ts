export interface LaoDistrict {
  name: string;
  nameEn: string;
}

export interface LaoProvince {
  name: string;
  nameEn: string;
  label: string;
  districts: LaoDistrict[];
}

export const LAO_LOCATIONS: LaoProvince[] = [
  {
    name: 'ນະຄອນຫຼວງວຽງຈັນ',
    nameEn: 'Vientiane Capital',
    label: 'ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)',
    districts: [
      { name: 'ຈັນທະບູລີ', nameEn: 'Chanthabuly' },
      { name: 'ສີໂຄດຕະບອງ', nameEn: 'Sikhottabong' },
      { name: 'ໄຊເສດຖາ', nameEn: 'Xaysetha' },
      { name: 'ສີສັດຕະນາກ', nameEn: 'Sisattanak' },
      { name: 'ນາຊາຍທອງ', nameEn: 'Naxaithong' },
      { name: 'ໄຊທານີ', nameEn: 'Xaythany' },
      { name: 'ຫາດຊາຍຟອງ', nameEn: 'Hadxayfong' },
      { name: 'ສັງທອງ', nameEn: 'Sangthong' },
      { name: 'ປາກງື່ມ', nameEn: 'Pakngum' },
    ],
  },
  {
    name: 'ແຂວງວຽງຈັນ',
    nameEn: 'Vientiane Province',
    label: 'ແຂວງວຽງຈັນ (Vientiane Province)',
    districts: [
      { name: 'ໂພນໂຮງ', nameEn: 'Phonhong' },
      { name: 'ທຸລະຄົມ', nameEn: 'Thoulakhom' },
      { name: 'ແກ້ວອຸດົມ', nameEn: 'Keooudom' },
      { name: 'ກາສີ', nameEn: 'Kasy' },
      { name: 'ວັງວຽງ', nameEn: 'Vangvieng' },
      { name: 'ເຟືອງ', nameEn: 'Feuang' },
      { name: 'ຊະນະຄາມ', nameEn: 'Xanakham' },
      { name: 'ແມດ', nameEn: 'Mad' },
      { name: 'ຫີນເຫີບ', nameEn: 'Hinheup' },
      { name: 'ໝື່ນ', nameEn: 'Meun' },
      { name: 'ຮົ່ມ', nameEn: 'Hom' },
      { name: 'ໄຊສົມບູນ', nameEn: 'Xaisomboun' },
    ],
  },
  {
    name: 'ຫຼວງພະບາງ',
    nameEn: 'Luangprabang',
    label: 'ຫຼວງພະບາງ (Luangprabang)',
    districts: [
      { name: 'ຫຼວງພະບາງ', nameEn: 'Luangprabang' },
      { name: 'ຊຽງເງິນ', nameEn: 'Xiengngeun' },
      { name: 'ນານ', nameEn: 'Nan' },
      { name: 'ປາກອູ', nameEn: 'Pak Ou' },
      { name: 'ນ້ຳບາກ', nameEn: 'Nambak' },
      { name: 'ງອຍ', nameEn: 'Ngoy' },
      { name: 'ປາກແຊງ', nameEn: 'Pak Xeng' },
      { name: 'ໂພນໄຊ', nameEn: 'Phonxay' },
      { name: 'ຈອມເພັດ', nameEn: 'Chomphet' },
      { name: 'ວຽງຄຳ', nameEn: 'Viengkham' },
      { name: 'ພູຄູນ', nameEn: 'Phoukhoun' },
      { name: 'ໂພນທອງ', nameEn: 'Phonthong' },
    ],
  },
  {
    name: 'ຈຳປາສັກ',
    nameEn: 'Champasak',
    label: 'ຈຳປາສັກ (Champasak)',
    districts: [
      { name: 'ປາກເຊ', nameEn: 'Pakse' },
      { name: 'ຊະນະສົມບູນ', nameEn: 'Sanasomboun' },
      { name: 'ບາຈຽງຈະເລີນສຸກ', nameEn: 'Bachiangchaleunsook' },
      { name: 'ປາກຊ່ອງ', nameEn: 'Paksong' },
      { name: 'ປະທຸມພອນ', nameEn: 'Pathoumphone' },
      { name: 'ໂພນທອງ', nameEn: 'Phonthong' },
      { name: 'ໂຊ້ງ', nameEn: 'Santhong' },
      { name: 'ສຸຂຸມາ', nameEn: 'Sukhuma' },
      { name: 'ມູນລະປະໂມກ', nameEn: 'Moonlapamok' },
      { name: 'ໂຂງ', nameEn: 'Khong' },
    ],
  },
  {
    name: 'ສະຫວັນນະເຂດ',
    nameEn: 'Savannakhet',
    label: 'ສະຫວັນນະເຂດ (Savannakhet)',
    districts: [
      { name: 'ໄກສອນ ພົມວິຫານ', nameEn: 'Kaysone Phomvihane' },
      { name: 'ອຸທຸມພອນ', nameEn: 'Outhoumphone' },
      { name: 'ອາດສະພັງທອງ', nameEn: 'Atsaphangthong' },
      { name: 'ພີນ', nameEn: 'Phine' },
      { name: 'ເຊໂປນ', nameEn: 'Sepone' },
      { name: 'ໜອງ', nameEn: 'Nong' },
      { name: 'ທ່າປາງທອງ', nameEn: 'Thapangthong' },
      { name: 'ສອງຄອນ', nameEn: 'Songkhone' },
      { name: 'ຈຳພອນ', nameEn: 'Chamonphone' },
      { name: 'ຊົນບູລີ', nameEn: 'Xonbuly' },
      { name: 'ໄຊບູລີ', nameEn: 'Xaybuly' },
      { name: 'ວິລະບູລີ', nameEn: 'Vilabuly' },
      { name: 'ອາດສະພອນ', nameEn: 'Assaphone' },
      { name: 'ໄຊພູທອງ', nameEn: 'Xonkhone' },
      { name: 'ພະລານໄຊ', nameEn: 'Phouthong' },
    ],
  },
  {
    name: 'ຄຳມ່ວນ',
    nameEn: 'Khammouane',
    label: 'ຄຳມ່ວນ (Khammouane)',
    districts: [
      { name: 'ທ່າແຂກ', nameEn: 'Thakhek' },
      { name: 'ມະຫາໄຊ', nameEn: 'Mahaxay' },
      { name: 'ໜອງບົກ', nameEn: 'Nongbok' },
      { name: 'ຫີນບູນ', nameEn: 'Hinboun' },
      { name: 'ຍົມມະລາດ', nameEn: 'Nhommalath' },
      { name: 'ບົວລະພາ', nameEn: 'Bualapha' },
      { name: 'ນາກາຍ', nameEn: 'Nakai' },
      { name: 'ເຊບັ້ງໄຟ', nameEn: 'Xebangfai' },
      { name: 'ໄຊຈຳພອນ', nameEn: 'Saihoum' },
    ],
  },
  {
    name: 'ບໍລິຄຳໄຊ',
    nameEn: 'Borikhamxay',
    label: 'ບໍລິຄຳໄຊ (Borikhamxay)',
    districts: [
      { name: 'ປາກຊັນ', nameEn: 'Pakxan' },
      { name: 'ທ່າພະບາດ', nameEn: 'Thaphabath' },
      { name: 'ປາກກະດິງ', nameEn: 'Pakkading' },
      { name: 'ບໍລິຄັນ', nameEn: 'Borikhan' },
      { name: 'ຄຳເກີດ', nameEn: 'Khamkeut' },
      { name: 'ວຽງທອງ', nameEn: 'Viengthong' },
      { name: 'ໄຊຈຳພອນ', nameEn: 'Xaychamphone' },
    ],
  },
  {
    name: 'ອຸດົມໄຊ',
    nameEn: 'Oudomxay',
    label: 'ອຸດົມໄຊ (Oudomxay)',
    districts: [
      { name: 'ໄຊ', nameEn: 'Xay' },
      { name: 'ຫຼາ', nameEn: 'La' },
      { name: 'ນ້ຳໝໍ້', nameEn: 'Nambor' },
      { name: 'ງາ', nameEn: 'Nga' },
      { name: 'ແບ່ງ', nameEn: 'Beng' },
      { name: 'ຮຸນ', nameEn: 'Houn' },
      { name: 'ປາກແບ່ງ', nameEn: 'Pakbeng' },
    ],
  },
  {
    name: 'ໄຊຍະບູລີ',
    nameEn: 'Xayaboury',
    label: 'ໄຊຍະບູລີ (Xayaboury)',
    districts: [
      { name: 'ໄຊຍະບູລີ', nameEn: 'Xayaboury' },
      { name: 'ຄອບ', nameEn: 'Khop' },
      { name: 'ຫົງສາ', nameEn: 'Hongsa' },
      { name: 'ເງິນ', nameEn: 'Ngeun' },
      { name: 'ຊຽງຮ່ອນ', nameEn: 'Xienghone' },
      { name: 'ພຽງ', nameEn: 'Phiang' },
      { name: 'ປາກລາຍ', nameEn: 'Parklai' },
      { name: 'ແກ່ນທ້າວ', nameEn: 'Kenethao' },
      { name: 'ບໍ່ແຕນ', nameEn: 'Botene' },
      { name: 'ທົ່ງມີໄຊ', nameEn: 'Thongmyxay' },
      { name: 'ໄຊສະຖານ', nameEn: 'Xaisathan' },
    ],
  },
  {
    name: 'ຊຽງຂວາງ',
    nameEn: 'Xiengkhouang',
    label: 'ຊຽງຂວາງ (Xiengkhouang)',
    districts: [
      { name: 'ແປກ', nameEn: 'Pek' },
      { name: 'ຄຳ', nameEn: 'Kham' },
      { name: 'ໜອງແຮດ', nameEn: 'Nonghet' },
      { name: 'ຄູນ', nameEn: 'Khoun' },
      { name: 'ທ່າໂທມ', nameEn: 'Thathom' },
      { name: 'ພູກູດ', nameEn: 'Phookoot' },
      { name: 'ຜາໄຊ', nameEn: 'Phaxay' },
    ],
  },
  {
    name: 'ຫົວພັນ',
    nameEn: 'Houaphanh',
    label: 'ຫົວພັນ (Houaphanh)',
    districts: [
      { name: 'ຊຳເໜືອ', nameEn: 'Xamneua' },
      { name: 'ຊຽງຄໍ້', nameEn: 'Xiengkhor' },
      { name: 'ຮ້ຽມ', nameEn: 'Hiam' },
      { name: 'ວຽງໄຊ', nameEn: 'Viengxay' },
      { name: 'ຫົວເມືອງ', nameEn: 'Huameuang' },
      { name: 'ຊຳໃຕ້', nameEn: 'Samtay' },
      { name: 'ສົບເບົາ', nameEn: 'Sop Bao' },
      { name: 'ແອດ', nameEn: 'Et' },
      { name: 'ໂກນ', nameEn: 'Kone' },
      { name: 'ຊ່ອນ', nameEn: 'Xon' },
    ],
  },
  {
    name: 'ຫຼວງນ້ຳທາ',
    nameEn: 'Luangnamtha',
    label: 'ຫຼວງນ້ຳທາ (Luangnamtha)',
    districts: [
      { name: 'ຫຼວງນ້ຳທາ', nameEn: 'Luangnamtha' },
      { name: 'ສິງ', nameEn: 'Sing' },
      { name: 'ລອງ', nameEn: 'Long' },
      { name: 'ວຽງພູຄາ', nameEn: 'Viengphoukha' },
      { name: 'ນາແລ', nameEn: 'Na Le' },
    ],
  },
  {
    name: 'ບໍ່ແກ້ວ',
    nameEn: 'Bokeo',
    label: 'ບໍ່ແກ້ວ (Bokeo)',
    districts: [
      { name: 'ຫ້ວຍຊາຍ', nameEn: 'Houayxay' },
      { name: 'ຕົ້ນເຜິ້ງ', nameEn: 'Tonpheung' },
      { name: 'ເມິງ', nameEn: 'Meung' },
      { name: 'ຜາອຸດົມ', nameEn: 'Pha Oudom' },
      { name: 'ປາກທາ', nameEn: 'Paktha' },
    ],
  },
  {
    name: 'ຜົ້ງສາລີ',
    nameEn: 'Phongsaly',
    label: 'ຜົ້ງສາລີ (Phongsaly)',
    districts: [
      { name: 'ຜົ້ງສາລີ', nameEn: 'Phongsaly' },
      { name: 'ໃໝ່', nameEn: 'May' },
      { name: 'ຂວາ', nameEn: 'Khoua' },
      { name: 'ສຳພັນ', nameEn: 'Samphanh' },
      { name: 'ບຸນເໜືອ', nameEn: 'Boun Neua' },
      { name: 'ຍອດອູ', nameEn: 'Yot Ou' },
      { name: 'ບຸນໃຕ້', nameEn: 'Boun Tay' },
    ],
  },
  {
    name: 'ສາລະວັນ',
    nameEn: 'Salavan',
    label: 'ສາລະວັນ (Salavan)',
    districts: [
      { name: 'ສາລະວັນ', nameEn: 'Salavan' },
      { name: 'ຕະໂອ້ຍ', nameEn: 'Ta-Oy' },
      { name: 'ຕຸ້ມລານ', nameEn: 'To vanity' },
      { name: 'ລະຄອນເພັງ', nameEn: 'Lakhonepheng' },
      { name: 'ວາປີ', nameEn: 'Vapi' },
      { name: 'ຄົງເຊໂດນ', nameEn: 'Khongxedone' },
      { name: 'ເລົ່າງາມ', nameEn: 'Lao Ngam' },
      { name: 'ສະໝ້ວຍ', nameEn: 'Samouay' },
    ],
  },
  {
    name: 'ເຊກອງ',
    nameEn: 'Sekong',
    label: 'ເຊກອງ (Sekong)',
    districts: [
      { name: 'ລະມາມ', nameEn: 'Lamam' },
      { name: 'ກະລຶມ', nameEn: 'Kaleum' },
      { name: 'ດັກຈຶງ', nameEn: 'Dakcheung' },
      { name: 'ທ່າແຕງ', nameEn: 'Tha Teng' },
    ],
  },
  {
    name: 'ອັດຕະປື',
    nameEn: 'Attapeu',
    label: 'ອັດຕະປື (Attapeu)',
    districts: [
      { name: 'ໄຊເສດຖາ', nameEn: 'Xaysetha' },
      { name: 'ສາມັກຄີໄຊ', nameEn: 'Samakkhixay' },
      { name: 'ສະໜາມໄຊ', nameEn: 'Sanamxay' },
      { name: 'ພູວົງ', nameEn: 'Phouvong' },
      { name: 'ສານໄຊ', nameEn: 'Sanxay' },
    ],
  },
  {
    name: 'ໄຊສົມບູນ',
    nameEn: 'Xaysomboun',
    label: 'ໄຊສົມບູນ (Xaysomboun)',
    districts: [
      { name: 'ອານຸວົງ', nameEn: 'Anouvong' },
      { name: 'ລອງແຈ້ງ', nameEn: 'Longchaeng' },
      { name: 'ທ່າໂທມ', nameEn: 'Thathom' },
      { name: 'ລອງຊານ', nameEn: 'Longxan' },
      { name: 'ຮົ່ມ', nameEn: 'Hom' },
    ],
  },
];

export const LAO_PROVINCES = LAO_LOCATIONS.map((p) => p.label);

export function getDistrictsForProvince(provinceNameOrLabel: string): LaoDistrict[] {
  if (!provinceNameOrLabel) return [];
  const found = LAO_LOCATIONS.find(
    (p) =>
      p.label === provinceNameOrLabel ||
      p.name === provinceNameOrLabel ||
      p.nameEn.toLowerCase() === provinceNameOrLabel.toLowerCase() ||
      provinceNameOrLabel.includes(p.name)
  );
  return found ? found.districts : [];
}
