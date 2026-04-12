@AGENTS.md

## デプロイ環境
- Vercel Hobbyプラン（サーバーレス関数デフォルト10秒タイムアウト）
- Supabase ap-south-1（ムンバイ）— DB往復レイテンシが大きい
- API修正時は必ず `vercel.json` の `maxDuration` 設定を確認すること
- フロントからAPIを呼ぶ処理には必ずエラーハンドリング（catch）を入れること
