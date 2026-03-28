import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | Scorely',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제1조(목적)</h2>
            <p>
              scorely(이하 &apos;회사&apos;라고 함)는 회사가 제공하고자 하는 서비스(이하 &apos;회사 서비스&apos;)를
              이용하는 개인(이하 &apos;이용자&apos; 또는 &apos;개인&apos;)의 정보(이하 &apos;개인정보&apos;)를
              보호하기 위해, 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하
              &apos;정보통신망법&apos;) 등 관련 법령을 준수하고, 서비스 이용자의 개인정보 보호 관련한 고충을
              신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침(이하 &apos;본
              방침&apos;)을 수립합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제2조(개인정보 처리의 원칙)</h2>
            <p>
              개인정보 관련 법령 및 본 방침에 따라 회사는 이용자의 개인정보를 수집할 수 있으며 수집된
              개인정보는 개인의 동의가 있는 경우에 한해 제3자에게 제공될 수 있습니다. 단, 법령의 규정 등에
              의해 적법하게 강제되는 경우 회사는 수집한 이용자의 개인정보를 사전에 개인의 동의 없이
              제3자에게 제공할 수도 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제3조(본 방침의 공개)</h2>
            <p>
              ① 회사는 이용자가 언제든지 쉽게 본 방침을 확인할 수 있도록 회사 홈페이지 첫 화면 또는 첫
              화면과의 연결화면을 통해 본 방침을 공개하고 있습니다.
            </p>
            <p className="mt-2">
              ② 회사는 제1항에 따라 본 방침을 공개하는 경우 글자 크기, 색상 등을 활용하여 이용자가 본
              방침을 쉽게 확인할 수 있도록 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제4조(본 방침의 변경)</h2>
            <p>
              ① 본 방침은 개인정보 관련 법령, 지침, 고시 또는 정부나 회사 서비스의 정책이나 내용의 변경에
              따라 개정될 수 있습니다.
            </p>
            <p className="mt-2">
              ② 회사는 제1항에 따라 본 방침을 개정하는 경우 다음 각 호 하나 이상의 방법으로 공지합니다.
            </p>
            <p className="mt-1 pl-4">
              가. 회사가 운영하는 인터넷 홈페이지의 첫 화면의 공지사항란 또는 별도의 창을 통하여 공지하는
              방법
            </p>
            <p className="pl-4">
              나. 서면·모사전송·전자우편 또는 이와 비슷한 방법으로 이용자에게 공지하는 방법
            </p>
            <p className="mt-2">
              ③ 회사는 제2항의 공지는 본 방침 개정의 시행일로부터 최소 7일 이전에 공지합니다. 다만,
              이용자 권리의 중요한 변경이 있을 경우에는 최소 30일 전에 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제5조(회원 가입을 위한 정보)</h2>
            <p>
              회사는 이용자의 회사 서비스에 대한 회원가입을 위하여 다음과 같은 정보를 수집합니다.
            </p>
            <p className="mt-1 pl-4">필수 수집 정보: 이메일 주소, 비밀번호 및 이름</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제6조(서비스 이용을 위한 정보)</h2>
            <p>회사는 서비스 제공을 위하여 다음과 같은 정보를 수집합니다.</p>
            <p className="mt-1 pl-4">필수 수집 정보: 이력서 PDF 파일, 직군 정보</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제7조(개인정보 수집 방법)</h2>
            <p>회사는 다음과 같은 방법으로 이용자의 개인정보를 수집합니다.</p>
            <p className="mt-1 pl-4">① 이용자가 회사의 홈페이지에 자신의 개인정보를 입력하는 방식</p>
            <p className="pl-4">
              ② 어플리케이션 등 회사가 제공하는 홈페이지 외의 서비스를 통해 이용자가 자신의 개인정보를
              입력하는 방식
            </p>
            <p className="pl-4">
              ③ 이용자가 고객센터의 상담, 게시판에서의 활동 등 회사의 서비스를 이용하는 과정에서 이용자가
              입력하는 방식
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제8조(개인정보의 이용)</h2>
            <p>회사는 개인정보를 다음 각 호의 경우에 이용합니다.</p>
            <p className="mt-1 pl-4">① 공지사항의 전달 등 회사운영에 필요한 경우</p>
            <p className="pl-4">
              ② 이용문의에 대한 회신, 불만의 처리 등 이용자에 대한 서비스 개선을 위한 경우
            </p>
            <p className="pl-4">③ 회사의 서비스를 제공하기 위한 경우</p>
            <p className="pl-4">
              ④ 법령 및 회사 약관을 위반하는 회원에 대한 이용 제한 조치, 부정 이용 행위를 포함하여
              서비스의 원활한 운영에 지장을 주는 행위에 대한 방지 및 제재를 위한 경우
            </p>
            <p className="pl-4">⑤ 이력서 분석 서비스 제공</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제9조(개인정보의 처리 위탁)</h2>
            <p>
              회사는 원활한 서비스 제공과 효과적인 업무를 처리하기 위하여 다음 각 호와 같이 개인정보를
              처리 위탁하고 있습니다.
            </p>
            <p className="mt-1 pl-4">
              ① Google LLC: 소셜 로그인 인증, AI 이력서 분석 / 회원 탈퇴 시 또는 위탁 계약 종료 시까지
            </p>
            <p className="pl-4">
              ② Amazon Web Services Inc.: 파일 저장 및 데이터베이스 운영 / 회원 탈퇴 시 또는 위탁 계약
              종료 시까지
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제10조(개인정보의 보유 및 이용기간)
            </h2>
            <p>
              ① 회사는 이용자의 개인정보에 대해 개인정보의 수집·이용 목적 달성을 위한 기간 동안
              개인정보를 보유 및 이용합니다.
            </p>
            <p className="mt-2">
              ② 전항에도 불구하고 회사는 내부 방침에 의해 서비스 부정이용기록은 부정 가입 및 이용 방지를
              위하여 회원 탈퇴 시점으로부터 최대 1년간 보관합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제11조(법령에 따른 개인정보의 보유 및 이용기간)
            </h2>
            <p>회사는 관계법령에 따라 다음과 같이 개인정보를 보유 및 이용합니다.</p>
            <p className="mt-1 pl-4">통신비밀보호법에 따른 보유정보 및 보유기간</p>
            <p className="pl-8">가. 웹사이트 로그 기록 자료 : 3개월</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제12조(개인정보의 파기원칙)</h2>
            <p>
              회사는 원칙적으로 이용자의 개인정보 처리 목적의 달성, 보유·이용기간의 경과 등 개인정보가
              필요하지 않을 경우에는 해당 정보를 지체 없이 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제13조(개인정보파기절차)</h2>
            <p>
              ① 이용자가 회원가입 등을 위해 입력한 정보는 개인정보 처리 목적이 달성된 후 별도의 DB로
              옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기
              되어집니다.
            </p>
            <p className="mt-2">
              ② 회사는 파기 사유가 발생한 개인정보를 개인정보보호 책임자의 승인절차를 거쳐 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제14조(개인정보파기방법)</h2>
            <p>
              회사는 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여
              삭제하며, 종이로 출력된 개인정보는 분쇄기로 분쇄하거나 소각 등을 통하여 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제15조(광고성 정보의 전송 조치)
            </h2>
            <p>
              ① 회사는 전자적 전송매체를 이용하여 영리목적의 광고성 정보를 전송하는 경우 이용자의
              명시적인 사전동의를 받습니다.
            </p>
            <p className="mt-2">
              ② 회사는 수신자가 수신거부의사를 표시하거나 사전 동의를 철회한 경우에는 영리목적의 광고성
              정보를 전송하지 않으며 수신거부 및 수신동의 철회에 대한 처리 결과를 알립니다.
            </p>
            <p className="mt-2">
              ③ 회사는 오후 9시부터 그다음 날 오전 8시까지의 시간에 전자적 전송매체를 이용하여 영리목적의
              광고성 정보를 전송하는 경우에는 그 수신자로부터 별도의 사전 동의를 받습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제16조(아동의 개인정보보호)</h2>
            <p>
              회사는 만 14세 미만 아동의 개인정보 보호를 위하여 만 14세 이상의 이용자에 한하여 회원가입을
              허용합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제17조(개인정보 조회 및 수집동의 철회)
            </h2>
            <p>
              ① 이용자 및 법정 대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수
              있으며 개인정보수집 동의 철회를 요청할 수 있습니다.
            </p>
            <p className="mt-2">
              ② 이용자 및 법정 대리인은 자신의 가입정보 수집 등에 대한 동의를 철회하기 위해서는
              개인정보보호책임자에게 전자우편으로 연락하시면 회사는 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제18조(개인정보 정보변경 등)
            </h2>
            <p>
              ① 이용자는 회사에게 전조의 방법을 통해 개인정보의 오류에 대한 정정을 요청할 수 있습니다.
            </p>
            <p className="mt-2">
              ② 회사는 전항의 경우에 개인정보의 정정을 완료하기 전까지 개인정보를 이용 또는 제공하지
              않으며 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이
              통지하여 정정이 이루어지도록 하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제19조(이용자의 의무)</h2>
            <p>
              ① 이용자는 자신의 개인정보를 최신의 상태로 유지해야 하며, 이용자의 부정확한 정보 입력으로
              발생하는 문제의 책임은 이용자 자신에게 있습니다.
            </p>
            <p className="mt-2">
              ② 타인의 개인정보를 도용한 회원가입의 경우 이용자 자격을 상실하거나 관련 개인정보보호
              법령에 의해 처벌받을 수 있습니다.
            </p>
            <p className="mt-2">
              ③ 이용자는 전자우편주소, 비밀번호 등에 대한 보안을 유지할 책임이 있으며 제3자에게 이를
              양도하거나 대여할 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제20조(회사의 개인정보 관리)
            </h2>
            <p>
              회사는 이용자의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 유출, 변조, 훼손 등이 되지
              아니하도록 안전성을 확보하기 위하여 필요한 기술적·관리적 보호대책을 강구하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제21조(삭제된 정보의 처리)</h2>
            <p>
              회사는 이용자 혹은 법정 대리인의 요청에 의해 해지 또는 삭제된 개인정보는 회사가 수집하는
              &apos;개인정보의 보유 및 이용기간&apos;에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는
              이용할 수 없도록 처리하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제22조(비밀번호의 암호화)</h2>
            <p>
              이용자의 비밀번호는 일방향 암호화하여 저장 및 관리되고 있으며, 개인정보의 확인, 변경은
              비밀번호를 알고 있는 본인에 의해서만 가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제23조(해킹 등에 대비한 대책)
            </h2>
            <p>
              ① 회사는 해킹, 컴퓨터 바이러스 등 정보통신망 침입에 의해 이용자의 개인정보가 유출되거나
              훼손되는 것을 막기 위해 최선을 다하고 있습니다.
            </p>
            <p className="mt-2">
              ② 회사는 최신 백신프로그램을 이용하여 이용자들의 개인정보나 자료가 유출 또는 손상되지
              않도록 방지하고 있습니다.
            </p>
            <p className="mt-2">
              ③ 회사는 만일의 사태에 대비하여 침입차단 시스템을 이용하여 보안에 최선을 다하고 있습니다.
            </p>
            <p className="mt-2">
              ④ 회사는 민감한 개인정보를 암호화 통신 등을 통하여 네트워크상에서 개인정보를 안전하게
              전송할 수 있도록 하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제24조(개인정보 처리 최소화 및 교육)
            </h2>
            <p>
              회사는 개인정보 관련 처리 담당자를 최소한으로 제한하며, 개인정보 처리자에 대한 교육 등
              관리적 조치를 통해 법령 및 내부방침 등의 준수를 강조하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제25조(개인정보 유출 등에 대한 조치)
            </h2>
            <p>
              회사는 개인정보의 분실·도난·유출(이하 &apos;유출 등&apos;이라 한다) 사실을 안 때에는 지체
              없이 다음 각 호의 모든 사항을 해당 이용자에게 알리고 방송통신위원회 또는
              한국인터넷진흥원에 신고합니다.
            </p>
            <p className="mt-1 pl-4">① 유출 등이 된 개인정보 항목</p>
            <p className="pl-4">② 유출 등이 발생한 시점</p>
            <p className="pl-4">③ 이용자가 취할 수 있는 조치</p>
            <p className="pl-4">④ 정보통신서비스 제공자 등의 대응 조치</p>
            <p className="pl-4">⑤ 이용자가 상담 등을 접수할 수 있는 부서 및 연락처</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제26조(개인정보 유출 등에 대한 조치의 예외)
            </h2>
            <p>
              회사는 전조에도 불구하고 이용자의 연락처를 알 수 없는 등 정당한 사유가 있는 경우에는
              회사의 홈페이지에 30일 이상 게시하는 방법으로 전조의 통지를 갈음하는 조치를 취할 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제27조(개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)
            </h2>
            <p>
              ① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로
              불러오는 개인정보 자동 수집장치(이하 &apos;쿠키&apos;)를 사용합니다.
            </p>
            <p className="mt-2">
              ② 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 이용자는 웹브라우저에서
              옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면
              모든 쿠키의 저장을 거부할 수도 있습니다.
            </p>
            <p className="mt-2">
              ③ 다만, 쿠키의 저장을 거부할 경우에는 로그인이 필요한 회사의 일부 서비스는 이용에 어려움이
              있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제28조(쿠키 설치 허용 지정 방법)
            </h2>
            <p>웹브라우저 옵션 설정을 통해 쿠키 허용, 쿠키 차단 등의 설정을 할 수 있습니다.</p>
            <p className="mt-1 pl-4">
              Edge : 웹브라우저 우측 상단의 설정 메뉴 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트
              데이터 관리 및 삭제
            </p>
            <p className="pl-4">
              Chrome : 웹브라우저 우측 상단의 설정 메뉴 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트
              데이터
            </p>
            <p className="pl-4">
              Whale : 웹브라우저 우측 상단의 설정 메뉴 &gt; 개인정보 보호 &gt; 쿠키 및 기타 사이트
              데이터
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제29조(회사의 개인정보 보호 책임자 지정)
            </h2>
            <p>
              회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이
              관련 부서 및 개인정보 보호 책임자를 지정하고 있습니다.
            </p>
            <div className="mt-2 pl-4">
              <p>개인정보 보호 책임자</p>
              <p>성명: 김승희</p>
              <p>이메일: bke1304@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              제30조(권익침해에 대한 구제방법)
            </h2>
            <p>
              ① 정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회,
              한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.
            </p>
            <div className="mt-1 pl-4">
              <p>가. 개인정보분쟁조정위원회 : (국번없이) 1833-6972 (www.kopico.go.kr)</p>
              <p>나. 개인정보침해신고센터 : (국번없이) 118 (privacy.kisa.or.kr)</p>
              <p>다. 대검찰청 : (국번없이) 1301 (www.spo.go.kr)</p>
              <p>라. 경찰청 : (국번없이) 182 (ecrm.cyber.go.kr)</p>
            </div>
            <p className="mt-2">
              ② 회사는 정보주체의 개인정보자기결정권을 보장하고, 개인정보침해로 인한 상담 및 피해 구제를
              위해 노력하고 있으며, 신고나 상담이 필요한 경우 제1항의 담당부서로 연락해주시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">부칙</h2>
            <p>제1조 본 방침은 2026.03.30.부터 시행됩니다.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
