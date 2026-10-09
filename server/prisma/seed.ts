import { PrismaClient, Role, Gender, PriorityFlag, ReportStatus, CampStatus, MatchPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { normalizeTransliteration } from '../src/utils/fuzzy';
import { MatchingEngineService } from '../src/services/matchingEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive ReunitePath database seeding...');

  // 1. Clean existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.safeCheckIn.deleteMany();
  await prisma.shelterEntry.deleteMany();
  await prisma.sighting.deleteMany();
  await prisma.missingReport.deleteMany();
  await prisma.person.deleteMany();
  await prisma.familyGroup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.disaster.deleteMany();

  // 2. Disasters
  const cycloneDisaster = await prisma.disaster.create({
    data: {
      name: 'Cyclone Michaung Flood Emergency',
      description: 'Severe coastal flooding and inundation across Chennai, Tiruvallur, and Kanchipuram districts.',
      location: 'Chennai Metropolitan Region, Tamil Nadu',
      state: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707,
      alertLevel: 'RED_ALERT',
      isActive: true,
    },
  });

  const wayanadDisaster = await prisma.disaster.create({
    data: {
      name: 'Wayanad Landslide Emergency',
      description: 'Triggered flash floods and hill landslides across Meppadi, Chooralmala, and Mundakkai.',
      location: 'Wayanad District, Kerala',
      state: 'Kerala',
      latitude: 11.5385,
      longitude: 76.1607,
      alertLevel: 'CRITICAL_ALERT',
      isActive: false,
    },
  });

  const cuddaloreDisaster = await prisma.disaster.create({
    data: {
      name: 'Cuddalore Coastal Cyclone Surge',
      description: 'Storm surge inundation and backwater overflow along Cuddalore harbor and Chidambaram delta.',
      location: 'Cuddalore & Chidambaram, Tamil Nadu',
      state: 'Tamil Nadu',
      latitude: 11.7480,
      longitude: 79.7714,
      alertLevel: 'ORANGE_ALERT',
      isActive: false,
    },
  });

  const assamDisaster = await prisma.disaster.create({
    data: {
      name: 'Assam Brahmaputra River Flood',
      description: 'Monsoon river overflow breaching embankments across Kamrup and Kaziranga valley.',
      location: 'Guwahati & Kaziranga, Assam',
      state: 'Assam',
      latitude: 26.1445,
      longitude: 91.7362,
      alertLevel: 'RED_ALERT',
      isActive: false,
    },
  });

  console.log('✅ Created 4 Disasters with real geographical coordinates');

  // 3. Camps for Chennai Cyclone
  const campLoyola = await prisma.camp.create({
    data: {
      disasterId: cycloneDisaster.id,
      name: 'Loyola College Relief Shelter',
      location: 'Sterling Road, Nungambakkam, Chennai',
      latitude: 13.0626,
      longitude: 80.2343,
      capacity: 500,
      currentOccupancy: 342,
      status: CampStatus.OPEN,
      contactPerson: 'Dr. S. Anthony (Nodal Officer)',
      contactPhone: '+91 94441 22334',
      needs: 'Baby food, Clean drinking water, Dry rations, Diapers',
    },
  });

  const campStThomas = await prisma.camp.create({
    data: {
      disasterId: cycloneDisaster.id,
      name: 'St. Thomas Community Hall Relief Camp',
      location: '12th Main Road, Anna Nagar West, Chennai',
      latitude: 13.0850,
      longitude: 80.2101,
      capacity: 300,
      currentOccupancy: 286,
      status: CampStatus.NEAR_CAPACITY,
      contactPerson: 'Fr. Joseph Raj',
      contactPhone: '+91 98402 33445',
      needs: 'Chronic medicines (Insulin, BP), Blankets, ORS packets, Mosquito nets',
    },
  });

  const campMarina = await prisma.camp.create({
    data: {
      disasterId: cycloneDisaster.id,
      name: 'Marina Flood Relief Center',
      location: 'Kamarajar Salai, Triplicane, Chennai',
      latitude: 13.0500,
      longitude: 80.2824,
      capacity: 450,
      currentOccupancy: 180,
      status: CampStatus.OPEN,
      contactPerson: 'Inspector V. Ramesh',
      contactPhone: '+91 98410 55667',
      needs: 'Tarpaulins, Biscuits, Sanitary pads, First-aid supplies',
    },
  });

  const campTambaram = await prisma.camp.create({
    data: {
      disasterId: cycloneDisaster.id,
      name: 'Tambaram Govt Higher Secondary Camp',
      location: 'GST Road, Tambaram, Chennai',
      latitude: 12.9249,
      longitude: 80.1275,
      capacity: 350,
      currentOccupancy: 215,
      status: CampStatus.OPEN,
      contactPerson: 'Headmistress Mary Stella',
      contactPhone: '+91 97910 88990',
      needs: 'Dry clothes, Solar torches, Drinking water cans',
    },
  });

  // Camps for Wayanad Landslide
  await prisma.camp.create({
    data: {
      disasterId: wayanadDisaster.id,
      name: 'Meppadi Govt Higher Secondary School Camp',
      location: 'Meppadi Town, Wayanad',
      latitude: 11.5510,
      longitude: 76.1265,
      capacity: 450,
      currentOccupancy: 310,
      status: CampStatus.OPEN,
      contactPerson: 'Tahsildar K. Mohanan',
      contactPhone: '+91 94470 11223',
      needs: 'Thermal blankets, Searchlights, Heavy rubber boots, First Aid',
    },
  });

  await prisma.camp.create({
    data: {
      disasterId: wayanadDisaster.id,
      name: 'Chooralmala St. Sebastian Church Shelter',
      location: 'Chooralmala Junction, Wayanad',
      latitude: 11.5320,
      longitude: 76.1750,
      capacity: 300,
      currentOccupancy: 240,
      status: CampStatus.NEAR_CAPACITY,
      contactPerson: 'Fr. Mathew Thomas',
      contactPhone: '+91 94471 33445',
      needs: 'Dry food packets, Clean drinking water, Trauma counseling kits',
    },
  });

  await prisma.camp.create({
    data: {
      disasterId: wayanadDisaster.id,
      name: 'Kalpetta SKMJ High School Base Camp',
      location: 'Main Road, Kalpetta, Wayanad',
      latitude: 11.6103,
      longitude: 76.0829,
      capacity: 500,
      currentOccupancy: 195,
      status: CampStatus.OPEN,
      contactPerson: 'Revenue Officer Deepa Nair',
      contactPhone: '+91 94472 55667',
      needs: 'Infant formula, Raincoats, Dettol/Antiseptic, Chronic medications',
    },
  });

  // Camps for Cuddalore Cyclone
  await prisma.camp.create({
    data: {
      disasterId: cuddaloreDisaster.id,
      name: 'Cuddalore Harbor Relief Camp',
      location: 'Sub-Jail Road, Cuddalore Port',
      latitude: 11.7520,
      longitude: 79.7680,
      capacity: 400,
      currentOccupancy: 220,
      status: CampStatus.OPEN,
      contactPerson: 'Revenue Inspector S. Baskaran',
      contactPhone: '+91 94431 88990',
      needs: 'Tarpaulins, Chlorine tablets, Mosquito coils, Dry rations',
    },
  });

  // Camps for Assam Flood
  await prisma.camp.create({
    data: {
      disasterId: assamDisaster.id,
      name: 'Guwahati Sarusajai Stadium Relief Base',
      location: 'Lokhra, Guwahati, Assam',
      latitude: 26.1158,
      longitude: 91.7640,
      capacity: 700,
      currentOccupancy: 480,
      status: CampStatus.OPEN,
      contactPerson: 'Disaster Nodal Officer B. Kalita',
      contactPhone: '+91 94350 44556',
      needs: 'Water purification sachets, Rice, Mosquito nets, Emergency lamps',
    },
  });

  console.log('✅ Created Relief Camps across all 4 Disaster Sectors');

  // 4. Users (Demo personas)
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'R. Anantharaman (State Relief Director)',
      email: 'admin@reunitepath.org',
      passwordHash,
      role: Role.ADMIN,
      phone: '+91 98840 10001',
    },
  });

  const coordinatorUser = await prisma.user.create({
    data: {
      name: 'P. Kavitha (Loyola Camp Coordinator)',
      email: 'coordinator@reunitepath.org',
      passwordHash,
      role: Role.COORDINATOR,
      campId: campLoyola.id,
      phone: '+91 98840 20002',
    },
  });

  const volunteerUser = await prisma.user.create({
    data: {
      name: 'V. Naveen (Red Cross Volunteer)',
      email: 'volunteer@reunitepath.org',
      passwordHash,
      role: Role.VOLUNTEER,
      campId: campStThomas.id,
      phone: '+91 98840 30003',
    },
  });

  const publicUser = await prisma.user.create({
    data: {
      name: 'Priya Selvam (Citizen / Family Member)',
      email: 'citizen@reunitepath.org',
      passwordHash,
      role: Role.PUBLIC,
      phone: '+91 98401 77889',
    },
  });

  console.log('✅ Created Demo Users (Admin, Coordinator, Volunteer, Public)');

  // 5. Family Groups
  const famRaman = await prisma.familyGroup.create({
    data: {
      disasterId: cycloneDisaster.id,
      token: 'FAM-CHENNAI-4091',
      primaryContactName: 'K. Ramanathan',
      contactPhone: '+91 98405 66778',
      notes: 'Velachery Lake View Colony family group, evacuated together',
    },
  });

  const famSelvam = await prisma.familyGroup.create({
    data: {
      disasterId: cycloneDisaster.id,
      token: 'FAM-CHENNAI-8832',
      primaryContactName: 'Priya Selvam',
      contactPhone: '+91 98401 77889',
      notes: 'Separated during boat rescue near Velachery bypass',
    },
  });

  // 6. Persons & Reports - Specific Scenarios

  // SCENARIO 1: High-confidence Direct Match (Murugan / Murugesh)
  // Person in missing report:
  const personMurugan = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Murugan Selvam',
      normalizedName: normalizeTransliteration('Murugan Selvam'),
      approxAge: 42,
      gender: Gender.MALE,
      physicalDesc: '5ft 9in, mustache, wearing blue collared shirt and black trousers',
      medicalNeeds: 'Mild diabetic',
      priorityFlag: PriorityFlag.NONE,
      familyGroupId: famSelvam.id,
    },
  });

  const repMurugan = await prisma.missingReport.create({
    data: {
      reportCode: 'MIS-7011',
      disasterId: cycloneDisaster.id,
      personId: personMurugan.id,
      reporterName: 'Priya Selvam',
      reporterPhone: '+91 98401 77889',
      reporterRelationship: 'Wife',
      lastSeenLocation: 'Velachery Bus Stand Junction',
      lastSeenDate: new Date(Date.now() - 36 * 3600 * 1000),
      notes: 'Got separated when the rescue raft took women and children first',
      status: ReportStatus.REPORTED,
    },
  });

  await prisma.statusEvent.create({
    data: {
      personId: personMurugan.id,
      missingReportId: repMurugan.id,
      status: ReportStatus.REPORTED,
      source: 'DIRECT_REPORT',
      location: 'Velachery Bus Stand Junction',
      notes: 'Report logged by wife Priya Selvam',
    },
  });

  // Person on Camp Roster (spelled Murugesh by volunteer at intake):
  const personMurugesh = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Murugesh Selvam',
      normalizedName: normalizeTransliteration('Murugesh Selvam'),
      approxAge: 43,
      gender: Gender.MALE,
      physicalDesc: 'Mustache, blue shirt, says wife was taken by NDRF boat',
      medicalNeeds: 'Diabetic meds needed',
      priorityFlag: PriorityFlag.NONE,
      familyGroupId: famSelvam.id,
    },
  });

  const shelterMurugesh = await prisma.shelterEntry.create({
    data: {
      entryCode: 'SHL-2041',
      disasterId: cycloneDisaster.id,
      campId: campLoyola.id,
      personId: personMurugesh.id,
      intakeVolunteerId: volunteerUser.id,
      arrivalDate: new Date(Date.now() - 18 * 3600 * 1000),
      groupNotes: 'Arrived via NDRF tractor from Velachery',
    },
  });

  // SCENARIO 2: Urgent Priority (Unaccompanied Minor: Aarav Kumar, Age 7)
  const personAarav = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Aarav Kumar',
      normalizedName: normalizeTransliteration('Aarav Kumar'),
      approxAge: 7,
      gender: Gender.MALE,
      physicalDesc: 'Wearing yellow cartoon t-shirt and carrying a red Spiderman backpack',
      priorityFlag: PriorityFlag.CHILD_ALONE,
    },
  });

  const repAarav = await prisma.missingReport.create({
    data: {
      reportCode: 'MIS-7022',
      disasterId: cycloneDisaster.id,
      personId: personAarav.id,
      reporterName: 'Sunita Kumar',
      reporterPhone: '+91 99620 44556',
      reporterRelationship: 'Mother',
      lastSeenLocation: 'Anna Nagar West Roundtana',
      lastSeenDate: new Date(Date.now() - 20 * 3600 * 1000),
      notes: 'Slipped away in heavy crowd while boarding emergency bus',
      status: ReportStatus.REPORTED,
    },
  });

  await prisma.statusEvent.create({
    data: {
      personId: personAarav.id,
      missingReportId: repAarav.id,
      status: ReportStatus.REPORTED,
      source: 'DIRECT_REPORT',
      location: 'Anna Nagar West Roundtana',
      notes: 'Report filed by mother Sunita Kumar. Priority: CHILD ALONE',
    },
  });

  const personAravShelter = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Arav Kumar',
      normalizedName: normalizeTransliteration('Arav Kumar'),
      approxAge: 7,
      gender: Gender.MALE,
      physicalDesc: 'Boy with yellow tee and red backpack, crying for mother Sunita',
      priorityFlag: PriorityFlag.CHILD_ALONE,
    },
  });

  const shelterAarav = await prisma.shelterEntry.create({
    data: {
      entryCode: 'SHL-2055',
      disasterId: cycloneDisaster.id,
      campId: campStThomas.id,
      personId: personAravShelter.id,
      intakeVolunteerId: volunteerUser.id,
      arrivalDate: new Date(Date.now() - 10 * 3600 * 1000),
      groupNotes: 'Found alone near Anna Nagar; safely sheltered in childcare room',
    },
  });

  // SCENARIO 3: FALLBACK SIGHTING LOGIC ("heading to Shelter B: St. Thomas Community Hall")
  const personMeenakshi = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Meenakshi Sundaram',
      normalizedName: normalizeTransliteration('Meenakshi Sundaram'),
      approxAge: 62,
      gender: Gender.FEMALE,
      physicalDesc: 'Elderly lady, gold spectacles, dark green silk saree, walking stick',
      medicalNeeds: 'Hypertension, needs BP medication daily',
      priorityFlag: PriorityFlag.ELDERLY,
    },
  });

  const repMeenakshi = await prisma.missingReport.create({
    data: {
      reportCode: 'MIS-7033',
      disasterId: cycloneDisaster.id,
      personId: personMeenakshi.id,
      reporterName: 'Sundaram Pillai',
      reporterPhone: '+91 97890 33221',
      reporterRelationship: 'Son',
      lastSeenLocation: 'Madipakkam Lake Road',
      lastSeenDate: new Date(Date.now() - 28 * 3600 * 1000),
      notes: 'Water rose to 4 feet, she was escorted by neighborhood youth group',
      status: ReportStatus.REPORTED,
    },
  });

  // Fallback Eyewitness Sighting pointing to Shelter B:
  const sightingMeenakshi = await prisma.sighting.create({
    data: {
      sightingCode: 'SGT-9011',
      disasterId: cycloneDisaster.id,
      sightedName: 'Meenakshi Amma',
      approxAge: 63,
      gender: Gender.FEMALE,
      sightingLocation: 'Madipakkam Main Road Police Booth',
      directionHeading: 'Escorted onto government bus heading towards St. Thomas Community Hall Relief Camp',
      groupSize: 4,
      additionalPeople: JSON.stringify(['Elderly man with umbrella', 'Two college volunteers']),
      witnessName: 'Karthik Subramanian',
      witnessPhone: '+91 98408 99887',
      notes: 'Wearing green saree with walking stick. Volunteers safely helped her board the bus.',
    },
  });

  // SCENARIO 4: Already Verified Safe (Demo success case)
  const personRajesh = await prisma.person.create({
    data: {
      disasterId: cycloneDisaster.id,
      fullName: 'Rajesh Kannan',
      normalizedName: normalizeTransliteration('Rajesh Kannan'),
      approxAge: 35,
      gender: Gender.MALE,
      physicalDesc: 'Grey hoodie, spectacles',
      priorityFlag: PriorityFlag.NONE,
    },
  });

  const repRajesh = await prisma.missingReport.create({
    data: {
      reportCode: 'MIS-7044',
      disasterId: cycloneDisaster.id,
      personId: personRajesh.id,
      reporterName: 'Deepa Kannan',
      reporterPhone: '+91 98402 11223',
      reporterRelationship: 'Sister',
      lastSeenLocation: 'Triplicane High Road',
      status: ReportStatus.VERIFIED_SAFE,
    },
  });

  const shelterRajesh = await prisma.shelterEntry.create({
    data: {
      entryCode: 'SHL-2010',
      disasterId: cycloneDisaster.id,
      campId: campMarina.id,
      personId: personRajesh.id,
      status: 'REUNITED',
    },
  });

  await prisma.statusEvent.create({
    data: {
      personId: personRajesh.id,
      missingReportId: repRajesh.id,
      status: ReportStatus.REPORTED,
      source: 'DIRECT_REPORT',
      location: 'Triplicane High Road',
      notes: 'Report filed by sister Deepa',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
  });

  await prisma.statusEvent.create({
    data: {
      personId: personRajesh.id,
      missingReportId: repRajesh.id,
      status: ReportStatus.LOCATED_AT_CAMP,
      source: 'OFFICIAL_ROSTER',
      location: 'Marina Flood Relief Center',
      notes: 'Registered on camp intake roster',
      verifiedByCampId: campMarina.id,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.statusEvent.create({
    data: {
      personId: personRajesh.id,
      missingReportId: repRajesh.id,
      status: ReportStatus.VERIFIED_SAFE,
      source: 'COORDINATOR_VERIFICATION',
      location: 'Marina Flood Relief Center',
      notes: 'ID verified by Relief Coordinator Inspector V. Ramesh. Family reunited.',
      verifiedByCampId: campMarina.id,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  // Approved Lead for Rajesh
  await prisma.lead.create({
    data: {
      id: `lead-${repRajesh.id}-${shelterRajesh.id}`,
      disasterId: cycloneDisaster.id,
      missingReportId: repRajesh.id,
      shelterEntryId: shelterRajesh.id,
      confidenceScore: 98,
      matchReason: 'Direct match at Marina Flood Relief Center (98% confidence)',
      explanation: 'Exact name match, matching age 35, location Triplicane verified against intake roster.',
      status: 'APPROVED',
      priority: MatchPriority.NORMAL,
      reviewedById: coordinatorUser.id,
      reviewNotes: 'Identity confirmed with Aadhaar card; sister Deepa arrived and picked him up.',
      reviewedAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  // 7. Seed 35 more diverse people to achieve 40+ people requirement
  const samplePeopleData = [
    { name: 'K. Ramanathan', age: 52, gender: Gender.MALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Spectacles, khadi shirt' },
    { name: 'Saraswathi Ramanathan', age: 48, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Maroon saree' },
    { name: 'Deepa Ramanathan', age: 19, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'College student, blue kurti' },
    { name: 'Mohammed Farooq', age: 38, gender: Gender.MALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Beard, white shirt' },
    { name: 'Fatima Farooq', age: 34, gender: Gender.FEMALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Black burqa' },
    { name: 'Zaid Farooq', age: 5, gender: Gender.MALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Striped t-shirt' },
    { name: 'Lakshmi Narayanan', age: 71, gender: Gender.MALE, camp: campStThomas, flag: PriorityFlag.ELDERLY, desc: 'Walking stick, heart medication needed' },
    { name: 'S. Vijayalakshmi', age: 68, gender: Gender.FEMALE, camp: campStThomas, flag: PriorityFlag.ELDERLY, desc: 'Yellow cotton saree, BP patient' },
    { name: 'Ananya Krishnan', age: 14, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'School uniform, ponytail' },
    { name: 'Dinesh Balaji', age: 29, gender: Gender.MALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'Denim jacket, IT professional' },
    { name: 'Pooja Balaji', age: 26, gender: Gender.FEMALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'Green salwar' },
    { name: 'Suresh Kumar', age: 45, gender: Gender.MALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Checked shirt, watch on right hand' },
    { name: 'Gowri Suresh', age: 41, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Blue floral saree' },
    { name: 'Nithin Suresh', age: 12, gender: Gender.MALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Sports shorts, red t-shirt' },
    { name: 'Anthony Doss', age: 50, gender: Gender.MALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Fisherman, tattoo on left forearm' },
    { name: 'Mary Stella Doss', age: 46, gender: Gender.FEMALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Red bindi, silver anklets' },
    { name: 'Vijay Anand', age: 31, gender: Gender.MALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'Black frame glasses' },
    { name: 'Swetha Anand', age: 28, gender: Gender.FEMALE, camp: campTambaram, flag: PriorityFlag.CRITICAL_MEDICAL, desc: 'Pregnant (7 months), needs OBGYN checkup' },
    { name: 'R. Soundararajan', age: 65, gender: Gender.MALE, camp: campStThomas, flag: PriorityFlag.ELDERLY, desc: 'Hearing aid in left ear' },
    { name: 'Kamala Soundararajan', age: 61, gender: Gender.FEMALE, camp: campStThomas, flag: PriorityFlag.ELDERLY, desc: 'Grey hair bun' },
    { name: 'Muthu Vel', age: 24, gender: Gender.MALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Delivery rider backpack' },
    { name: 'Kaviarasan S.', age: 22, gender: Gender.MALE, camp: campMarina, flag: PriorityFlag.NONE, desc: 'Student volunteer' },
    { name: 'Banu Priya', age: 33, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Nurse uniform, steth in pouch' },
    { name: 'Harish Shankar', age: 39, gender: Gender.MALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'T-shirt with company logo' },
    { name: 'Divya Harish', age: 36, gender: Gender.FEMALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'Pink dupatta' },
    { name: 'Sai Charan', age: 8, gender: Gender.MALE, camp: campTambaram, flag: PriorityFlag.NONE, desc: 'Batman t-shirt' },
    { name: 'Subbulakshmi M.', age: 74, gender: Gender.FEMALE, camp: campStThomas, flag: PriorityFlag.ELDERLY, desc: 'Wheelchair user, arthritic' },
    { name: 'Gopalakrishnan V.', age: 56, gender: Gender.MALE, camp: campStThomas, flag: PriorityFlag.NONE, desc: 'Bank passbook in pocket' },
    { name: 'Revathi G.', age: 53, gender: Gender.FEMALE, camp: campStThomas, flag: PriorityFlag.NONE, desc: 'Orange cotton saree' },
    { name: 'Vignesh G.', age: 27, gender: Gender.MALE, camp: campStThomas, flag: PriorityFlag.NONE, desc: 'Helmet in hand' },
    { name: 'Padmavathi R.', age: 40, gender: Gender.FEMALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Teacher, purple saree' },
    { name: 'Srinivasan R.', age: 44, gender: Gender.MALE, camp: campLoyola, flag: PriorityFlag.NONE, desc: 'Government employee ID' },
  ];

  for (let i = 0; i < samplePeopleData.length; i++) {
    const item = samplePeopleData[i];
    const person = await prisma.person.create({
      data: {
        disasterId: cycloneDisaster.id,
        fullName: item.name,
        normalizedName: normalizeTransliteration(item.name),
        approxAge: item.age,
        gender: item.gender,
        physicalDesc: item.desc,
        priorityFlag: item.flag,
        medicalNeeds: item.flag === PriorityFlag.CRITICAL_MEDICAL ? 'Urgent medical attention' : null,
      },
    });

    await prisma.shelterEntry.create({
      data: {
        entryCode: `SHL-${3000 + i}`,
        disasterId: cycloneDisaster.id,
        campId: item.camp.id,
        personId: person.id,
        arrivalDate: new Date(Date.now() - (i * 2 + 1) * 3600 * 1000),
        status: 'IN_SHELTER',
      },
    });
  }

  console.log(`✅ Created ${samplePeopleData.length + 8} total people across camps and reports!`);

  // 8. Run Matching Engine across seed data to automatically populate Leads
  console.log('🔄 Running Relational Matching Engine on initial reports...');
  await MatchingEngineService.matchForMissingReport(repMurugan.id);
  await MatchingEngineService.matchForMissingReport(repAarav.id);
  await MatchingEngineService.matchForMissingReport(repMeenakshi.id);

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEEDED',
      entityType: 'Disaster',
      entityId: cycloneDisaster.id,
      details: 'System initialized with Cyclone Michaung operational dataset (4 camps, 40+ people).',
    },
  });

  console.log('🎉 Database seeding completed successfully! All scenarios ready for demo.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
