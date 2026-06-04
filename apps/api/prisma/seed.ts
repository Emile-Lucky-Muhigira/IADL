/**
 * Database seed — creates a rich, multi-tenant data set for local development & testing.
 *
 * Idempotent: safe to run repeatedly. Core entities are upserted on deterministic keys;
 * notifications & messages (which have no natural key) are only seeded when their tables
 * are empty so re-runs don't duplicate them.
 *
 * Run:  npx ts-node prisma/seed.ts   (or: npm run db:seed)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 12);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

async function main() {
  console.log('🌱 Seeding database...');

  // ── Global administrators (no tenant) ───────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@iadl.ac.ke' },
    update: {},
    create: {
      email: 'superadmin@iadl.ac.ke',
      passwordHash: await hash('Admin@1234!'),
      firstName: 'System', lastName: 'Admin', role: 'SUPER_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@iadl.ac.ke' },
    update: {},
    create: {
      email: 'admin@iadl.ac.ke',
      passwordHash: await hash('Admin@1234!'),
      firstName: 'ADL', lastName: 'Administrator', role: 'ADL_ADMIN',
    },
  });

  // ── Tenants (two schools, to exercise multi-tenant isolation) ────────────
  const nairobi = await prisma.tenant.upsert({
    where: { domain: 'nairobi.adlschools.ac.ke' },
    update: {},
    create: {
      name: 'ADL Nairobi', domain: 'nairobi.adlschools.ac.ke',
      address: 'Westcom Point Building, Westlands, Nairobi',
      phone: '+254 11 3630966', email: 'nairobi@adlschools.ac.ke',
    },
  });

  const mombasa = await prisma.tenant.upsert({
    where: { domain: 'mombasa.adlschools.ac.ke' },
    update: {},
    create: {
      name: 'ADL Mombasa', domain: 'mombasa.adlschools.ac.ke',
      address: 'Nyali Road, Mombasa', phone: '+254 11 3630977',
      email: 'mombasa@adlschools.ac.ke',
    },
  });

  // ── Helper to upsert a user by email ─────────────────────────────────────
  async function user(email: string, data: {
    tenantId?: string; firstName: string; lastName: string; role: string;
    phone?: string; password?: string;
  }) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await hash(data.password ?? 'Pass@1234!'),
        tenantId: data.tenantId,
        firstName: data.firstName, lastName: data.lastName,
        role: data.role as any, phone: data.phone,
      },
    });
  }

  // ── Nairobi staff (documented test accounts kept intact) ─────────────────
  const gatekeeper = await user('gatekeeper@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'James', lastName: 'Kamau', role: 'SCHOOL_GATEKEEPER', phone: '+254700000001' });
  const trainer = await user('trainer@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Grace', lastName: 'Njeri', role: 'TRAINER', phone: '+254700000002' });
  const trainer2 = await user('david.trainer@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'David', lastName: 'Ochieng', role: 'TRAINER', phone: '+254700000012' });
  const accountant = await user('finance@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Peter', lastName: 'Mwangi', role: 'ACCOUNTANT', phone: '+254700000005' });
  await user('auditor@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Ann', lastName: 'Wambui', role: 'SYSTEM_AUDITOR' });

  // ── Nairobi parents ──────────────────────────────────────────────────────
  const parentMary = await user('parent@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Mary', lastName: 'Otieno', role: 'PARENT', phone: '+254700000004' });
  const parentJohn = await user('john.parent@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'John', lastName: 'Mutua', role: 'PARENT', phone: '+254700000014' });

  // ── Nairobi students ──────────────────────────────────────────────────────
  const student = await user('student@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Brian', lastName: 'Otieno', role: 'STUDENT', phone: '+254700000003' });
  const aisha = await user('aisha@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Aisha', lastName: 'Hussein', role: 'STUDENT', phone: '+254700000006' });
  const kevin = await user('kevin@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Kevin', lastName: 'Mutua', role: 'STUDENT', phone: '+254700000007' });
  const faith = await user('faith@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Faith', lastName: 'Otieno', role: 'STUDENT', phone: '+254700000008' });
  const samuel = await user('samuel@nairobi.adlschools.ac.ke', { tenantId: nairobi.id, firstName: 'Samuel', lastName: 'Kiprop', role: 'STUDENT', phone: '+254700000009' });

  // ── Mombasa users (separate tenant) ───────────────────────────────────────
  await user('gatekeeper@mombasa.adlschools.ac.ke', { tenantId: mombasa.id, firstName: 'Hassan', lastName: 'Ali', role: 'SCHOOL_GATEKEEPER', phone: '+254700000021' });
  const mbsTrainer = await user('trainer@mombasa.adlschools.ac.ke', { tenantId: mombasa.id, firstName: 'Zawadi', lastName: 'Mwakio', role: 'TRAINER', phone: '+254700000022' });
  const amina = await user('amina@mombasa.adlschools.ac.ke', { tenantId: mombasa.id, firstName: 'Amina', lastName: 'Said', role: 'STUDENT', phone: '+254700000023' });
  const omar = await user('omar@mombasa.adlschools.ac.ke', { tenantId: mombasa.id, firstName: 'Omar', lastName: 'Bakari', role: 'STUDENT', phone: '+254700000024' });
  await user('parent@mombasa.adlschools.ac.ke', { tenantId: mombasa.id, firstName: 'Fatuma', lastName: 'Said', role: 'PARENT', phone: '+254700000025' });

  // ── Parent ↔ student links ────────────────────────────────────────────────
  const links: [string, string][] = [
    [parentMary.id, student.id],
    [parentMary.id, faith.id],
    [parentJohn.id, kevin.id],
  ];
  for (const [parentId, studentId] of links) {
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      update: {},
      create: { parentId, studentId },
    });
  }

  // ── Courses ────────────────────────────────────────────────────────────────
  async function course(id: string, data: { tenantId: string; title: string; description: string; price: number; duration: number; trainerIds: string[] }) {
    return prisma.course.upsert({
      where: { id },
      update: {},
      create: {
        id, tenantId: data.tenantId, title: data.title, description: data.description,
        price: data.price, duration: data.duration,
        trainers: { connect: data.trainerIds.map((tid) => ({ id: tid })) },
      },
    });
  }

  const dataEng = await course('seed-course-data-eng', { tenantId: nairobi.id, title: 'Data Engineering Fundamentals', description: 'ETL pipelines, warehousing, and cloud data infrastructure.', price: 45000, duration: 120, trainerIds: [trainer.id] });
  const webDev = await course('seed-course-web-dev', { tenantId: nairobi.id, title: 'Full-Stack Web Development', description: 'Build modern web apps with React, Node.js and PostgreSQL.', price: 38000, duration: 100, trainerIds: [trainer2.id] });
  const cloud = await course('seed-course-cloud', { tenantId: nairobi.id, title: 'Cloud Computing with AWS', description: 'Core AWS services, IAM, and deployment best practices.', price: 52000, duration: 90, trainerIds: [trainer.id, trainer2.id] });
  const mbsAcct = await course('seed-course-mbs-acct', { tenantId: mombasa.id, title: 'Business Accounting', description: 'Financial statements, ledgers and tax basics.', price: 30000, duration: 80, trainerIds: [mbsTrainer.id] });

  // ── Enrollments ──────────────────────────────────────────────────────────
  const enrollments: { userId: string; courseId: string; status: string }[] = [
    { userId: student.id, courseId: dataEng.id, status: 'COMPLETED' }, // → certificate
    { userId: aisha.id, courseId: dataEng.id, status: 'ACTIVE' },
    { userId: kevin.id, courseId: dataEng.id, status: 'ACTIVE' },
    { userId: faith.id, courseId: webDev.id, status: 'ACTIVE' },
    { userId: samuel.id, courseId: webDev.id, status: 'ACTIVE' },
    { userId: student.id, courseId: cloud.id, status: 'ACTIVE' },
    { userId: amina.id, courseId: mbsAcct.id, status: 'ACTIVE' },
    { userId: omar.id, courseId: mbsAcct.id, status: 'ACTIVE' },
  ];
  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: e.userId, courseId: e.courseId } },
      update: { status: e.status as any },
      create: { userId: e.userId, courseId: e.courseId, status: e.status as any },
    });
  }

  // ── Sessions (past sessions enable attendance history) ───────────────────
  async function session(id: string, data: { courseId: string; tenantId: string; title: string; scheduledAt: Date; duration?: number; isLive?: boolean }) {
    return prisma.session.upsert({
      where: { id },
      update: {},
      create: {
        id, courseId: data.courseId, tenantId: data.tenantId, title: data.title,
        scheduledAt: data.scheduledAt, duration: data.duration ?? 90, isLive: data.isLive ?? false,
      },
    });
  }

  const deSessions = [
    await session('seed-de-s1', { courseId: dataEng.id, tenantId: nairobi.id, title: 'Intro to Data Pipelines', scheduledAt: daysAgo(20) }),
    await session('seed-de-s2', { courseId: dataEng.id, tenantId: nairobi.id, title: 'Batch vs Streaming', scheduledAt: daysAgo(13) }),
    await session('seed-de-s3', { courseId: dataEng.id, tenantId: nairobi.id, title: 'Data Warehousing', scheduledAt: daysAgo(6) }),
    await session('seed-de-s4', { courseId: dataEng.id, tenantId: nairobi.id, title: 'Orchestration with Airflow', scheduledAt: daysAgo(1) }),
    await session('seed-de-s5', { courseId: dataEng.id, tenantId: nairobi.id, title: 'Capstone Review', scheduledAt: daysFromNow(3), isLive: true }),
  ];
  await session('seed-wd-s1', { courseId: webDev.id, tenantId: nairobi.id, title: 'HTML/CSS Foundations', scheduledAt: daysAgo(8) });
  await session('seed-wd-s2', { courseId: webDev.id, tenantId: nairobi.id, title: 'React Components', scheduledAt: daysFromNow(2), isLive: true });
  await session('seed-mbs-s1', { courseId: mbsAcct.id, tenantId: mombasa.id, title: 'The Accounting Equation', scheduledAt: daysAgo(5) });

  // ── Attendance ───────────────────────────────────────────────────────────
  // Brian: strong attendance. Kevin: deliberately below the 80% alert threshold.
  const attendance: { userId: string; sessionId: string; status: string }[] = [
    { userId: student.id, sessionId: 'seed-de-s1', status: 'PRESENT' },
    { userId: student.id, sessionId: 'seed-de-s2', status: 'PRESENT' },
    { userId: student.id, sessionId: 'seed-de-s3', status: 'LATE' },
    { userId: student.id, sessionId: 'seed-de-s4', status: 'PRESENT' },
    { userId: aisha.id, sessionId: 'seed-de-s1', status: 'PRESENT' },
    { userId: aisha.id, sessionId: 'seed-de-s2', status: 'ABSENT' },
    { userId: aisha.id, sessionId: 'seed-de-s3', status: 'PRESENT' },
    { userId: aisha.id, sessionId: 'seed-de-s4', status: 'PRESENT' },
    { userId: kevin.id, sessionId: 'seed-de-s1', status: 'ABSENT' },
    { userId: kevin.id, sessionId: 'seed-de-s2', status: 'ABSENT' },
    { userId: kevin.id, sessionId: 'seed-de-s3', status: 'PRESENT' },
    { userId: kevin.id, sessionId: 'seed-de-s4', status: 'ABSENT' },
  ];
  for (const a of attendance) {
    await prisma.attendanceRecord.upsert({
      where: { userId_sessionId: { userId: a.userId, sessionId: a.sessionId } },
      update: { status: a.status as any },
      create: { userId: a.userId, sessionId: a.sessionId, status: a.status as any },
    });
  }

  // ── Assessments + submissions ─────────────────────────────────────────────
  async function assessment(id: string, data: { courseId: string; title: string; type: string; maxScore?: number; dueDate?: Date }) {
    return prisma.assessment.upsert({
      where: { id },
      update: {},
      create: { id, courseId: data.courseId, title: data.title, type: data.type as any, maxScore: data.maxScore ?? 100, dueDate: data.dueDate },
    });
  }
  const quiz = await assessment('seed-de-quiz1', { courseId: dataEng.id, title: 'Pipelines Quiz', type: 'QUIZ', maxScore: 20, dueDate: daysAgo(10) });
  const assign = await assessment('seed-de-assign1', { courseId: dataEng.id, title: 'Build an ETL Job', type: 'ASSIGNMENT', maxScore: 100, dueDate: daysAgo(3) });
  const exam = await assessment('seed-de-exam1', { courseId: dataEng.id, title: 'Final Exam', type: 'EXAM', maxScore: 100, dueDate: daysFromNow(7) });

  const submissions: { assessmentId: string; studentId: string; content: string; score?: number; feedback?: string }[] = [
    { assessmentId: quiz.id, studentId: student.id, content: 'Quiz answers A,B,C', score: 18, feedback: 'Excellent grasp of fundamentals.' },
    { assessmentId: quiz.id, studentId: aisha.id, content: 'Quiz answers', score: 15, feedback: 'Good, revisit windowing.' },
    { assessmentId: assign.id, studentId: student.id, content: 'https://github.com/brian/etl-job', score: 92, feedback: 'Clean, well-tested pipeline.' },
    { assessmentId: assign.id, studentId: aisha.id, content: 'https://github.com/aisha/etl-job' }, // ungraded
  ];
  for (const s of submissions) {
    await prisma.assessmentSubmission.upsert({
      where: { assessmentId_studentId: { assessmentId: s.assessmentId, studentId: s.studentId } },
      update: {},
      create: {
        assessmentId: s.assessmentId, studentId: s.studentId, content: s.content,
        score: s.score, feedback: s.feedback,
        gradedById: s.score != null ? trainer.id : null,
        gradedAt: s.score != null ? daysAgo(2) : null,
      },
    });
  }

  // ── Finance ledger (reference is unique → idempotent upsert) ──────────────
  // amounts: DEBIT increases balance owed, CREDIT/REFUND reduces it.
  const ledger: { ref: string; userId: string; type: string; amount: number; description: string; balance: number; createdAt: Date }[] = [
    { ref: 'SEED-INV-BRIAN-1', userId: student.id, type: 'DEBIT', amount: 45000, description: 'Tuition invoice — Data Engineering', balance: 45000, createdAt: daysAgo(25) },
    { ref: 'SEED-PAY-BRIAN-1', userId: student.id, type: 'CREDIT', amount: 45000, description: 'M-Pesa payment received', balance: 0, createdAt: daysAgo(22) },
    { ref: 'SEED-INV-KEVIN-1', userId: kevin.id, type: 'DEBIT', amount: 45000, description: 'Tuition invoice — Data Engineering', balance: 45000, createdAt: daysAgo(25) },
    { ref: 'SEED-PAY-KEVIN-1', userId: kevin.id, type: 'CREDIT', amount: 20000, description: 'Part payment', balance: 25000, createdAt: daysAgo(18) },
    { ref: 'SEED-INV-AISHA-1', userId: aisha.id, type: 'DEBIT', amount: 45000, description: 'Tuition invoice — Data Engineering', balance: 45000, createdAt: daysAgo(24) },
  ];
  for (const l of ledger) {
    await prisma.ledgerEntry.upsert({
      where: { reference: l.ref },
      update: {},
      create: {
        reference: l.ref, tenantId: nairobi.id, userId: l.userId, type: l.type as any,
        amount: l.amount, description: l.description, balance: l.balance,
        createdById: accountant.id, createdAt: l.createdAt,
      },
    });
  }

  // ── Certificate for the completed enrollment ──────────────────────────────
  await prisma.certificate.upsert({
    where: { userId_courseId: { userId: student.id, courseId: dataEng.id } },
    update: {},
    create: { userId: student.id, courseId: dataEng.id },
  });

  // ── Notifications (seed only when empty to stay idempotent) ───────────────
  if ((await prisma.notification.count()) === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: student.id, type: 'CERTIFICATE_ISSUED', title: 'Certificate Issued', body: 'Your certificate for Data Engineering Fundamentals is ready.' },
        { userId: kevin.id, type: 'ATTENDANCE_ALERT', title: 'Low Attendance Warning', body: 'Your attendance rate is 25%. Please attend sessions regularly.' },
        { userId: parentJohn.id, type: 'ATTENDANCE_ALERT', title: 'Attendance Alert', body: "Kevin Mutua's attendance has dropped to 25%." },
        { userId: aisha.id, type: 'PAYMENT_DUE', title: 'Payment Due', body: 'You have an outstanding balance of KES 45,000.' },
      ],
    });
  }

  // ── Messages (seed only when empty) ───────────────────────────────────────
  if ((await prisma.message.count()) === 0) {
    await prisma.message.create({
      data: {
        senderId: gatekeeper.id,
        subject: 'Welcome to the new term',
        content: 'Dear trainers, please finalize your session schedules by Friday.',
        recipients: { create: [{ userId: trainer.id }, { userId: trainer2.id }] },
      },
    });
    await prisma.message.create({
      data: {
        senderId: trainer.id,
        subject: 'Capstone review reminder',
        content: 'Reminder: the capstone review session is in 3 days. Come prepared.',
        recipients: { create: [{ userId: student.id }, { userId: aisha.id }, { userId: kevin.id }] },
      },
    });
  }

  console.log('✅ Seed complete.\n');
  console.log('Tenants: ADL Nairobi, ADL Mombasa');
  console.log('Test accounts (password Admin@1234! for admins, Pass@1234! for the rest):');
  console.table([
    { Role: 'Super Admin', Email: 'superadmin@iadl.ac.ke' },
    { Role: 'ADL Admin', Email: 'admin@iadl.ac.ke' },
    { Role: 'Gatekeeper (Nairobi)', Email: 'gatekeeper@nairobi.adlschools.ac.ke' },
    { Role: 'Trainer (Nairobi)', Email: 'trainer@nairobi.adlschools.ac.ke' },
    { Role: 'Student (Nairobi)', Email: 'student@nairobi.adlschools.ac.ke' },
    { Role: 'Parent (Nairobi)', Email: 'parent@nairobi.adlschools.ac.ke' },
    { Role: 'Accountant (Nairobi)', Email: 'finance@nairobi.adlschools.ac.ke' },
    { Role: 'Auditor (Nairobi)', Email: 'auditor@nairobi.adlschools.ac.ke' },
    { Role: 'Gatekeeper (Mombasa)', Email: 'gatekeeper@mombasa.adlschools.ac.ke' },
    { Role: 'Student (Mombasa)', Email: 'amina@mombasa.adlschools.ac.ke' },
  ]);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
