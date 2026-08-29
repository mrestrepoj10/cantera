import { ModelUpload } from '@/components/model-upload'

// Two-legged: the page talks to the app's own OSS bucket and needs no user
// sign-in. Gate the route yourself before exposing it beyond a trusted team.
export default function ModelUploadPage() {
  return <ModelUpload />
}
