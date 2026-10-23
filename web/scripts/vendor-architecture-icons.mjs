import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const webRoot = path.resolve(import.meta.dirname, '..')
const tmpRoot = path.join(webRoot, '.tmp-icons')
const serviceDir = path.join(webRoot, 'src/features/workspace/icons/service')
const providerDir = path.join(webRoot, 'src/features/workspace/icons/providers')
const entriesPath = path.join(webRoot, 'src/features/catalog/entries.ts')

const PACKS = {
  aws: {
    url: 'https://d1.awsstatic.com/onedam/marketing-channels/website/public/shared/architecture-icon-release/Icon-package_07312026.5846e92413caa21490223536cc97f1269e44fa92.zip',
    zip: 'aws-icons.zip',
  },
  azure: {
    url: 'https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip',
    zip: 'azure-icons.zip',
  },
  gcpCore: {
    url: 'https://services.google.com/fh/files/misc/core-products-icons.zip',
    zip: 'gcp-core.zip',
  },
  gcpCategory: {
    url: 'https://services.google.com/fh/files/misc/category-icons.zip',
    zip: 'gcp-category.zip',
  },
  gcpLegacy: {
    url: 'https://services.google.com/fh/files/misc/google-cloud-legacy-icons.zip',
    zip: 'gcp-legacy.zip',
  },
}

const EXACT_BASENAME = {
  'aws-ecs': 'Arch_Amazon-Elastic-Container-Service_64.svg',
  'aws-eks': 'Arch_Amazon-Elastic-Kubernetes-Service_64.svg',
  'aws-s3': 'Arch_Amazon-Simple-Storage-Service_64.svg',
  'aws-vpc': 'Virtual-private-cloud-VPC_32.svg',
  'aws-sqs': 'Arch_Amazon-Simple-Queue-Service_64.svg',
  'aws-sns': 'Arch_Amazon-Simple-Notification-Service_64.svg',
  'aws-ebs': 'Arch_Amazon-Elastic-Block-Store_64.svg',
  'aws-application-load-balancer': 'Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg',
  'aws-network-load-balancer': 'Res_Elastic-Load-Balancing_Network-Load-Balancer_48.svg',
  'azure-aks': '10023-icon-service-Kubernetes-Services.svg',
  'azure-app-service': '10035-icon-service-App-Services.svg',
  'azure-batch': '10031-icon-service-Batch-Accounts.svg',
  'azure-container-apps': '02989-icon-service-Container-Apps-Environments.svg',
  'azure-files': '10838-icon-service-Storage-Azure-Files.svg',
  'azure-blob-storage': '10780-icon-service-Blob-Block.svg',
  'azure-dns': '10064-icon-service-DNS-Zones.svg',
  'azure-firewall': '10084-icon-service-Firewalls.svg',
  'azure-azure-sql': '02390-icon-service-Azure-SQL.svg',
  'azure-web-pubsub': '02987-icon-service-pubsub.svg',
  'azure-application-gateway': '10076-icon-service-Application-Gateways.svg',
  'azure-disk-storage': '10032-icon-service-Disks.svg',
  'azure-netapp-files': '10096-icon-service-Azure-NetApp-Files.svg',
  'azure-data-lake-storage': '10090-icon-service-Data-Lake-Storage-Gen1.svg',
  'azure-database-for-postgresql': '10131-icon-service-Azure-Database-PostgreSQL-Server.svg',
  'gcp-compute-engine': 'ComputeEngine-512-color-rgb.svg',
  'gcp-cloud-run': 'CloudRun-512-color-rgb.svg',
  'gcp-cloud-storage': 'Cloud_Storage-512-color.svg',
  'gcp-cloud-sql': 'CloudSQL-512-color.svg',
  'gcp-spanner': 'CloudSpanner-512-color.svg',
  'gcp-bigquery': 'BigQuery-512-color.svg',
  'gcp-apigee': 'Apigee-512-color-rgb.svg',
  'gcp-cloud-run-functions': 'cloud_functions.svg',
  'gcp-app-engine': 'app_engine.svg',
  'gcp-batch': 'batch.svg',
  'gcp-persistent-disk': 'persistent_disk.svg',
  'gcp-filestore': 'filestore.svg',
  'gcp-bigtable': 'bigtable.svg',
  'gcp-firestore': 'firestore.svg',
  'gcp-memorystore': 'memorystore.svg',
  'gcp-cloud-cdn': 'cloud_cdn.svg',
  'gcp-media-cdn': 'cloud_media_edge.svg',
  'gcp-cloud-load-balancing': 'cloud_load_balancing.svg',
  'gcp-cloud-dns': 'cloud_dns.svg',
  'gcp-cloud-armor': 'cloud_armor.svg',
  'gcp-cloud-nat': 'cloud_nat.svg',
  'gcp-cloud-interconnect': 'cloud_interconnect.svg',
  'gcp-pub-sub': 'pubsub.svg',
  'gcp-cloud-tasks': 'cloud_tasks.svg',
  'gcp-eventarc': 'eventarc.svg',
  'gcp-workflows': 'workflows.svg',
  'gcp-cloud-scheduler': 'cloud_scheduler.svg',
  'gcp-api-gateway': 'cloud_api_gateway.svg',
  'gcp-dataflow': 'dataflow.svg',
  'gcp-dataproc': 'dataproc.svg',
  'gcp-transcoder-api': 'stream_suite.svg',
  'gcp-live-stream-api': 'cloud_media_edge.svg',
}

const PROVIDER_MARKS = {
  aws: 'Architecture-Group-Icons_07312026/AWS-Cloud_32.svg',
  azure: '10018-icon-service-Azure-A.svg',
  gcp: 'cloud_generic/cloud_generic.svg',
}

const K8S = {
  'kubernetes-deployment':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/deploy.svg',
  'kubernetes-statefulset':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/sts.svg',
  'kubernetes-job':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/job.svg',
  'kubernetes-service':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/svc.svg',
  'kubernetes-ingress':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/ing.svg',
  'kubernetes-horizontalpodautoscaler':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/hpa.svg',
  'kubernetes-persistentvolumeclaim':
    'https://raw.githubusercontent.com/kubernetes/community/master/icons/svg/resources/unlabeled/pvc.svg',
  'kubernetes-kubernetes-scalability-thresholds':
    'https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg',
}

const ALIASES = {
  'aws-application-load-balancer': ['elastic-load-balancing', 'application-load-balancer', 'alb'],
  'aws-network-load-balancer': ['network-load-balancer', 'nlb'],
  'aws-api-gateway': ['api-gateway'],
  'aws-route-53': ['route-53', 'route53'],
  'aws-kinesis-data-streams': ['kinesis-data-streams', 'kinesis'],
  'aws-msk': ['managed-streaming-for-apache-kafka', 'msk'],
  'aws-opensearch-service': ['opensearch'],
  'aws-elastic-beanstalk': ['elastic-beanstalk', 'elasticbeanstalk'],
  'aws-app-runner': ['app-runner'],
  'aws-storage-gateway': ['storage-gateway'],
  'aws-global-accelerator': ['global-accelerator'],
  'aws-direct-connect': ['direct-connect'],
  'aws-step-functions': ['step-functions'],
  'aws-eventbridge': ['eventbridge'],
  'aws-appsync': ['appsync'],
  'aws-documentdb': ['documentdb', 'document-db'],
  'aws-keyspaces': ['keyspaces'],
  'aws-timestream': ['timestream'],
  'aws-memorydb': ['memorydb'],
  'aws-mediaconvert': ['mediaconvert', 'elemental-mediaconvert'],
  'aws-medialive': ['medialive', 'elemental-medialive'],
  'aws-mediapackage': ['mediapackage', 'elemental-mediapackage'],
  'aws-ivs': ['interactive-video-service', 'ivs'],
  'aws-elasticache': ['elasticache', 'elasti-cache'],
  'azure-azure-sql': ['sql-databases', 'sql-database', 'azure-sql'],
  'azure-virtual-machines': ['virtual-machine', 'virtual-machines'],
  'azure-vm-scale-sets': ['vm-scale-sets', 'virtual-machine-scale'],
  'azure-container-instances': ['container-instances'],
  'azure-container-apps': ['container-apps'],
  'azure-data-lake-storage': ['data-lake-storage', 'data-lake'],
  'azure-elastic-san': ['elastic-san'],
  'azure-sql-managed-instance': ['sql-managed-instance'],
  'azure-database-for-postgresql': ['postgresql', 'database-postgresql'],
  'azure-database-for-mysql': ['mysql', 'database-mysql'],
  'azure-managed-instance-for-apache-cassandra': ['cassandra', 'managed-instance-apache-cassandra'],
  'azure-cache-for-redis': ['cache-redis', 'redis-cache'],
  'azure-managed-redis': ['managed-redis'],
  'azure-content-delivery-network': ['cdn-profiles', 'cdn'],
  'azure-application-gateway': ['application-gateways', 'application-gateway'],
  'azure-web-application-firewall': ['web-application-firewall', 'waf'],
  'azure-vpn-gateway': ['virtual-network-gateways', 'vpn-gateway'],
  'azure-service-bus': ['service-bus'],
  'azure-event-grid': ['event-grid-topics', 'event-grid'],
  'azure-event-hubs': ['event-hubs'],
  'azure-queue-storage': ['storage-queue', 'queue-storage'],
  'azure-api-management': ['api-management-services', 'api-management'],
  'azure-logic-apps': ['logic-apps'],
  'azure-web-pubsub': ['web-pubsub'],
  'azure-data-explorer': ['data-explorer-clusters', 'data-explorer'],
  'azure-stream-analytics': ['stream-analytics'],
  'azure-synapse-analytics': ['azure-synapse-analytics', 'synapse'],
  'azure-databricks': ['azure-databricks', 'databricks'],
  'azure-data-factory': ['data-factories', 'data-factory'],
  'azure-disk-storage': ['disks', 'disk-storage'],
  'azure-netapp-files': ['netapp', 'azure-netapp-files'],
  'azure-front-door': ['front-door'],
  'azure-blob-storage': ['storage-accounts', 'blob-storage', 'storage-blob'],
  'azure-files': ['storage-azure-files', 'files'],
  'azure-cosmos-db': ['cosmos-db', 'azure-cosmos-db'],
  'azure-aks': ['kubernetes-services', 'aks'],
  'azure-app-service': ['app-services', 'app-service'],
  'azure-functions': ['function-apps', 'functions'],
  'azure-load-balancer': ['load-balancers', 'load-balancer'],
  'azure-dns': ['dns-zones', 'dns'],
  'azure-expressroute': ['expressroute-circuits', 'expressroute'],
  'azure-firewall': ['azure-firewall', 'firewalls'],
  'azure-traffic-manager': ['traffic-manager-profiles', 'traffic-manager'],
  'gcp-cloud-run-functions': ['cloud-functions', 'functions'],
  'gcp-cloud-load-balancing': ['cloud-load-balancing', 'load-balancing'],
  'gcp-pub-sub': ['pubsub', 'pub-sub', 'cloud-pubsub'],
  'gcp-cloud-run': ['cloud-run'],
  'gcp-transcoder-api': ['transcoder'],
  'gcp-live-stream-api': ['live-stream', 'livestream'],
  'gcp-cloud-nat': ['cloud-nat'],
  'gcp-cloud-interconnect': ['cloud-interconnect', 'interconnect'],
  'gcp-cloud-armor': ['cloud-armor'],
  'gcp-api-gateway': ['api-gateway'],
  'gcp-cloud-run-functions': ['cloud-functions'],
  'gcp-memorystore': ['memorystore'],
  'gcp-persistent-disk': ['persistent-disk'],
}

const STOP = new Set([
  'amazon',
  'aws',
  'azure',
  'google',
  'cloud',
  'service',
  'services',
  'icon',
  'arch',
  'res',
  'for',
  'and',
  'the',
])

function parseEntries(text) {
  const rows = []
  const blocks = text.split(/\n\s*\{/).slice(1)
  for (const block of blocks) {
    const id = block.match(/"id":\s*"([^"]+)"/)?.[1]
    const provider = block.match(/"provider":\s*"([^"]+)"/)?.[1]
    const name = block.match(/"name":\s*"([^"]+)"/)?.[1]
    if (id && provider && name) rows.push({ id, provider, name })
  }
  return rows
}

function walkSvgs(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__MACOSX' || entry.name.startsWith('._')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkSvgs(full, out)
    else if (entry.name.toLowerCase().endsWith('.svg')) out.push(full)
  }
  return out
}

function findByBasename(files, basename) {
  const needle = basename.toLowerCase()
  return files.find((file) => path.basename(file).toLowerCase() === needle)
}

function norm(value) {
  return value
    .toLowerCase()
    .replace(/\.svg$/, '')
    .replace(/arch_|res_|icon-service-|icon-res-|numbered-/g, '')
    .replace(/amazon-|aws-|azure-|google-cloud-|gcp-|microsoft-/g, '')
    .replace(/_\d+$/, '')
    .replace(/[^a-z0-9]+/g, '')
}

function tokensOf(value) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP.has(token))
}

function sizeBonus(filePath) {
  const match = filePath.match(/_(16|32|48|64)(?:_Dark)?\.svg$/i)
  const size = match ? Number(match[1]) : 0
  return size
}

function kindBonus(filePath) {
  const lower = filePath.replaceAll('\\', '/').toLowerCase()
  if (lower.includes('architecture-service') || lower.includes('/arch_')) return 30
  if (lower.includes('core-products') || lower.includes('icon-service')) return 24
  if (lower.includes('resource-icons') || lower.includes('icon-res')) return 8
  return 12
}

const EXTRA_PENALTY = [
  'anywhere',
  'outposts',
  'lattice',
  'distro',
  'glacier',
  'automatic',
  'plans',
  'environments',
  'hub',
  'fleet',
  'snapshots',
  'warehouses',
  'classic',
  'privateresolver',
  'manager',
]

function extraPenalty(filePath, entry) {
  const base = norm(path.basename(filePath))
  const allowed = norm([entry.name, entry.id, ...(ALIASES[entry.id] ?? [])].join(' '))
  let penalty = 0
  for (const extra of EXTRA_PENALTY) {
    if (base.includes(extra) && !allowed.includes(extra)) penalty += 90
  }
  return penalty
}

function scoreCandidate(filePath, entry) {
  const lower = filePath.replaceAll('\\', '/').toLowerCase()
  if (lower.includes('_dark') || lower.includes('/dark/')) return 0
  const base = path.basename(filePath)
  const fileNorm = norm(base)
  const fileTokens = new Set(tokensOf(base.replace(/^\d+-icon-service-/, '')))
  const names = [entry.name, entry.id.replace(/^(aws|azure|gcp|kubernetes)-/, ''), ...(ALIASES[entry.id] ?? [])]
  let best = 0
  for (const name of names) {
    const nameNorm = norm(name)
    if (!nameNorm) continue
    if (fileNorm === nameNorm) best = Math.max(best, 140)
    else if (nameNorm.length >= 4 && (fileNorm.endsWith(nameNorm) || fileNorm.includes(nameNorm))) {
      best = Math.max(best, 80 - Math.abs(fileNorm.length - nameNorm.length))
    }
    const tokens = tokensOf(name)
    if (tokens.length && tokens.every((token) => fileTokens.has(token) || fileNorm.includes(token))) {
      best = Math.max(best, 50 + tokens.length * 6)
    }
  }
  if (best === 0) return 0
  return best + kindBonus(filePath) + sizeBonus(filePath) / 8 - extraPenalty(filePath, entry)
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`cached ${path.basename(dest)}`)
    return
  }
  console.log(`downloading ${url}`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

function unzip(zipPath, dest) {
  fs.mkdirSync(dest, { recursive: true })
  execFileSync(
    'tar',
    ['-xf', zipPath, '-C', dest],
    { stdio: 'inherit', windowsHide: true },
  )
}

function copyUnmodified(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

function pickProviderMark(files, needles) {
  let best
  let bestScore = 0
  for (const file of files) {
    const lower = file.replaceAll('\\', '/').toLowerCase()
    if (lower.includes('_dark')) continue
    const base = norm(path.basename(file))
    if (!needles.some((needle) => base.includes(norm(needle)) || lower.includes(needle))) continue
    const score = kindBonus(file) + sizeBonus(file) + (lower.includes('64') ? 10 : 0)
    if (score > bestScore) {
      best = file
      bestScore = score
    }
  }
  return best
}

const entries = parseEntries(fs.readFileSync(entriesPath, 'utf8'))
fs.mkdirSync(tmpRoot, { recursive: true })
fs.mkdirSync(serviceDir, { recursive: true })
fs.mkdirSync(providerDir, { recursive: true })

for (const pack of Object.values(PACKS)) {
  const zipPath = path.join(tmpRoot, pack.zip)
  await download(pack.url, zipPath)
  const dest = path.join(tmpRoot, pack.zip.replace(/\.zip$/, ''))
  if (!fs.existsSync(dest) || walkSvgs(dest).length === 0) {
    fs.mkdirSync(dest, { recursive: true })
    unzip(zipPath, dest)
  }
}

for (const [id, url] of Object.entries(K8S)) {
  const dest = path.join(serviceDir, `${id}.svg`)
  await download(url, dest)
}

const awsFiles = walkSvgs(path.join(tmpRoot, 'aws-icons'))
const azureFiles = walkSvgs(path.join(tmpRoot, 'azure-icons'))
const gcpFiles = [
  ...walkSvgs(path.join(tmpRoot, 'gcp-core')),
  ...walkSvgs(path.join(tmpRoot, 'gcp-category')),
  ...walkSvgs(path.join(tmpRoot, 'gcp-legacy')),
]

const filesByProvider = {
  aws: awsFiles,
  azure: azureFiles,
  gcp: gcpFiles,
  kubernetes: [],
}

const unmatched = []
for (const entry of entries) {
  if (entry.provider === 'kubernetes') {
    if (!fs.existsSync(path.join(serviceDir, `${entry.id}.svg`))) unmatched.push(entry.id)
    continue
  }
  const files = filesByProvider[entry.provider] ?? []
  const exact = EXACT_BASENAME[entry.id] ? findByBasename(files, EXACT_BASENAME[entry.id]) : undefined
  let best = exact
  let bestScore = exact ? 999 : 0
  if (!exact) {
    for (const file of files) {
      const score = scoreCandidate(file, entry)
      if (score > bestScore) {
        best = file
        bestScore = score
      }
    }
  }
  if (!best || bestScore < 50) {
    unmatched.push(`${entry.id} (best ${best ? path.basename(best) : 'none'} ${bestScore.toFixed(1)})`)
    continue
  }
  copyUnmodified(best, path.join(serviceDir, `${entry.id}.svg`))
  console.log(`mapped ${entry.id} <- ${path.relative(tmpRoot, best)} [${bestScore.toFixed(1)}]`)
}

function resolveProviderMark(provider, files, relativeOrBasename) {
  const normalized = relativeOrBasename.replaceAll('/', path.sep)
  const byRelative = files.find((file) => file.replaceAll('/', path.sep).endsWith(normalized))
  return byRelative ?? findByBasename(files, path.basename(relativeOrBasename))
}

const awsMark = resolveProviderMark('aws', awsFiles, PROVIDER_MARKS.aws)
const azureMark = resolveProviderMark('azure', azureFiles, PROVIDER_MARKS.azure)
const gcpMark = resolveProviderMark('gcp', gcpFiles, PROVIDER_MARKS.gcp)
const k8sMark = path.join(serviceDir, 'kubernetes-kubernetes-scalability-thresholds.svg')

if (awsMark) copyUnmodified(awsMark, path.join(providerDir, 'aws.svg'))
if (azureMark) copyUnmodified(azureMark, path.join(providerDir, 'azure.svg'))
if (gcpMark) copyUnmodified(gcpMark, path.join(providerDir, 'gcp.svg'))
if (fs.existsSync(k8sMark)) copyUnmodified(k8sMark, path.join(providerDir, 'kubernetes.svg'))

console.log('\nProvider marks:')
console.log(' aws', awsMark ?? 'MISSING')
console.log(' azure', azureMark ?? 'MISSING')
console.log(' gcp', gcpMark ?? 'MISSING')
console.log('\nUnmatched:')
for (const id of unmatched) console.log(' ', id)
console.log(`\nDone. unmatched=${unmatched.length}`)
