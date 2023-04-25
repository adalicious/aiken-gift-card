import type { NextPage } from "next";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <div className="h-fill flex flex-col items-center pt-24">
        <p className="text-gray-600 mt-6 title-lg">Aiken Gift Card Example</p>
        <div className="wrapper-xs box-slate flex flex-col text-center items-center p-12 mt-6">
          
          <button className="btn-primary items-center" onClick={() => router.push("/create")}>
            Create Gift Card
          </button>

        </div>

        <div className="flex mt-4 items-center">
          <p className="text-gray-400 ">
            Powered by
            <span className="hover:text-txpink ml-1">
              <a href="https://github.com/txpipe/adalicious-starter-kit">Adalicious</a>
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
