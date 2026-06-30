import { Skeleton, Card } from 'antd';

// 帖子卡片骨架
export function PostCardSkeleton() {
  return (
    <Card style={{ marginBottom: 12 }}>
      <Skeleton active paragraph={{ rows: 2 }} />
    </Card>
  );
}

// 帖子详情骨架
export function PostDetailSkeleton() {
  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
      <Card style={{ marginTop: 16 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    </div>
  );
}

// 版块列表骨架
export function BoardListSkeleton() {
  return (
    <div className="page-container">
      <Skeleton.Input active style={{ width: 200, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// 首页骨架
export function HomeSkeleton() {
  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Skeleton.Input active style={{ width: '100%', height: 80 }} />
      </Card>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} style={{ flex: 1 }}>
            <Skeleton.Avatar active size="large" />
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
      <div style={{ display: 'flex', gap: 16 }}>
        <Card style={{ flex: 2 }}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
        <Card style={{ flex: 1 }}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    </div>
  );
}

// 个人中心骨架
export function ProfileSkeleton() {
  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Skeleton.Avatar active size={80} />
          <Skeleton.Input active style={{ width: 120, marginTop: 12 }} />
        </div>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
}

// 通用列表骨架
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="page-container">
      <Skeleton.Input active style={{ width: 200, marginBottom: 24 }} />
      <Card>
        <Skeleton active paragraph={{ rows }} />
      </Card>
    </div>
  );
}
